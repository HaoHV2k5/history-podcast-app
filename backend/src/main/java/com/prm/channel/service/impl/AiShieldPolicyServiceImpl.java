package com.prm.channel.service.impl;

import com.prm.channel.dto.request.AiShieldPolicyConfigRequest;
import com.prm.channel.dto.response.AiShieldPolicyConfigResponse;
import com.prm.channel.entity.AiShieldPolicyConfig;
import com.prm.channel.repository.AiShieldPolicyConfigRepository;
import com.prm.channel.service.AiShieldPolicyService;
import com.prm.common.enums.AiShieldTier;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AiShieldPolicyServiceImpl implements AiShieldPolicyService {

    private final AiShieldPolicyConfigRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<AiShieldPolicyConfigResponse> getAllConfigs() {
        List<AiShieldPolicyConfig> configs = repository.findAllByOrderByDisplayOrderAscMinScoreAsc();
        if (configs.isEmpty()) {
            return getDefaultConfigResponses();
        }
        return configs.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AiShieldPolicyConfigResponse getConfigByTier(AiShieldTier tier) {
        if (tier == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mã phân tầng (tier) không được để trống");
        }
        return repository.findByTier(tier)
                .map(this::mapToResponse)
                .orElseGet(() -> mapToDefaultResponse(tier));
    }

    @Override
    public AiShieldPolicyConfigResponse updateConfig(AiShieldTier tier, AiShieldPolicyConfigRequest request) {
        if (tier == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mã phân tầng (tier) không được để trống");
        }
        validateScoreRange(request.getMinScore(), request.getMaxScore());

        AiShieldPolicyConfig entity = repository.findByTier(tier)
                .orElseGet(() -> AiShieldPolicyConfig.builder().tier(tier).build());

        entity.setLabel(request.getLabel());
        entity.setMinScore(request.getMinScore());
        entity.setMaxScore(request.getMaxScore());
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getActionType() != null) {
            entity.setActionType(request.getActionType());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getDisplayOrder() != null) {
            entity.setDisplayOrder(request.getDisplayOrder());
        }

        AiShieldPolicyConfig saved = repository.save(entity);
        log.info("Updated AI Shield policy config for tier [{}]: {}% - {}%, label: {}",
                tier, saved.getMinScore(), saved.getMaxScore(), saved.getLabel());
        return mapToResponse(saved);
    }

    @Override
    public List<AiShieldPolicyConfigResponse> batchUpdateConfigs(List<AiShieldPolicyConfigRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Danh sách cấu hình không được để trống");
        }

        List<AiShieldPolicyConfigResponse> results = new ArrayList<>();
        for (AiShieldPolicyConfigRequest req : requests) {
            if (req.getTier() == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mỗi cấu hình cần chỉ định trường tier");
            }
            results.add(updateConfig(req.getTier(), req));
        }
        return results;
    }

    @Override
    public List<AiShieldPolicyConfigResponse> resetDefaultConfigs() {
        log.info("Resetting AI Shield policy configs to default thresholds and labels...");
        for (AiShieldTier tier : AiShieldTier.values()) {
            AiShieldPolicyConfig entity = repository.findByTier(tier)
                    .orElseGet(() -> AiShieldPolicyConfig.builder().tier(tier).build());

            entity.setLabel(tier.getDefaultLabel());
            entity.setMinScore(tier.getDefaultMinScore());
            entity.setMaxScore(tier.getDefaultMaxScore());
            entity.setDescription(tier.getDefaultDescription());
            entity.setActionType("MANUAL_REVIEW");
            entity.setIsActive(true);
            entity.setDisplayOrder(tier.ordinal() + 1);

            repository.save(entity);
        }
        return getAllConfigs();
    }

    @Override
    @Transactional(readOnly = true)
    public AiShieldTierEvaluation resolveTier(BigDecimal score) {
        if (score == null) {
            return new AiShieldTierEvaluation(AiShieldTier.RED_ALERT, AiShieldTier.RED_ALERT.getDefaultLabel(), "MANUAL_REVIEW");
        }

        List<AiShieldPolicyConfig> activeConfigs = repository.findByIsActiveTrueOrderByDisplayOrderAscMinScoreAsc();
        if (!activeConfigs.isEmpty()) {
            for (AiShieldPolicyConfig cfg : activeConfigs) {
                boolean minMatch = score.compareTo(cfg.getMinScore()) >= 0;
                boolean maxMatch;
                if (cfg.getMaxScore().compareTo(BigDecimal.valueOf(100)) >= 0) {
                    maxMatch = score.compareTo(cfg.getMaxScore()) <= 0;
                } else {
                    maxMatch = score.compareTo(cfg.getMaxScore()) < 0;
                }

                if (minMatch && maxMatch) {
                    return new AiShieldTierEvaluation(cfg.getTier(), cfg.getLabel(), cfg.getActionType());
                }
            }

            // Nếu vượt trên cấu hình cao nhất
            AiShieldPolicyConfig highest = activeConfigs.get(activeConfigs.size() - 1);
            if (score.compareTo(highest.getMaxScore()) > 0) {
                return new AiShieldTierEvaluation(highest.getTier(), highest.getLabel(), highest.getActionType());
            }

            // Nếu dưới cấu hình thấp nhất
            AiShieldPolicyConfig lowest = activeConfigs.get(0);
            if (score.compareTo(lowest.getMinScore()) < 0) {
                return new AiShieldTierEvaluation(lowest.getTier(), lowest.getLabel(), lowest.getActionType());
            }
        }

        // Fallback mặc định theo Enum
        return resolveFallbackEnum(score);
    }

    private AiShieldTierEvaluation resolveFallbackEnum(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(50)) < 0) {
            return new AiShieldTierEvaluation(AiShieldTier.RED_ALERT, AiShieldTier.RED_ALERT.getDefaultLabel(), "MANUAL_REVIEW");
        } else if (score.compareTo(BigDecimal.valueOf(80)) < 0) {
            return new AiShieldTierEvaluation(AiShieldTier.FAIR, AiShieldTier.FAIR.getDefaultLabel(), "MANUAL_REVIEW");
        } else if (score.compareTo(BigDecimal.valueOf(90)) <= 0) {
            return new AiShieldTierEvaluation(AiShieldTier.GOOD, AiShieldTier.GOOD.getDefaultLabel(), "MANUAL_REVIEW");
        } else {
            return new AiShieldTierEvaluation(AiShieldTier.EXCELLENT, AiShieldTier.EXCELLENT.getDefaultLabel(), "MANUAL_REVIEW");
        }
    }

    private void validateScoreRange(BigDecimal min, BigDecimal max) {
        if (min == null || max == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mức điểm minScore và maxScore không được để trống");
        }
        if (min.compareTo(BigDecimal.ZERO) < 0 || max.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mức điểm phải nằm trong khoảng từ 0% đến 100%");
        }
        if (min.compareTo(max) >= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mức điểm tối thiểu (minScore) phải nhỏ hơn mức điểm tối đa (maxScore)");
        }
    }

    private AiShieldPolicyConfigResponse mapToResponse(AiShieldPolicyConfig entity) {
        return AiShieldPolicyConfigResponse.builder()
                .id(entity.getId())
                .tier(entity.getTier())
                .label(entity.getLabel())
                .minScore(entity.getMinScore())
                .maxScore(entity.getMaxScore())
                .description(entity.getDescription())
                .actionType(entity.getActionType())
                .isActive(entity.getIsActive())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private List<AiShieldPolicyConfigResponse> getDefaultConfigResponses() {
        List<AiShieldPolicyConfigResponse> list = new ArrayList<>();
        for (AiShieldTier tier : AiShieldTier.values()) {
            list.add(mapToDefaultResponse(tier));
        }
        return list;
    }

    private AiShieldPolicyConfigResponse mapToDefaultResponse(AiShieldTier tier) {
        return AiShieldPolicyConfigResponse.builder()
                .tier(tier)
                .label(tier.getDefaultLabel())
                .minScore(tier.getDefaultMinScore())
                .maxScore(tier.getDefaultMaxScore())
                .description(tier.getDefaultDescription())
                .actionType("MANUAL_REVIEW")
                .isActive(true)
                .displayOrder(tier.ordinal() + 1)
                .build();
    }
}
