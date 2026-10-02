package com.prm.channel.service.impl;

import com.prm.channel.dto.request.AdminModerationDecisionRequest;
import com.prm.channel.dto.response.AdminModerationItemResponse;
import com.prm.channel.entity.AiFilterLog;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.ModerationReview;
import com.prm.channel.repository.AiFilterLogRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.ModerationReviewRepository;
import com.prm.channel.service.AdminModerationService;
import com.prm.common.dto.PageResponse;
import com.prm.common.enums.ContentStatus;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminModerationServiceImpl implements AdminModerationService {

    private final ModerationReviewRepository moderationReviewRepository;
    private final AiFilterLogRepository aiFilterLogRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminModerationItemResponse> searchReviews(
            String decision,
            String tier,
            String search,
            Pageable pageable
    ) {
        String cleanDecision = StringUtils.hasText(decision) ? decision.trim().toUpperCase() : null;
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;

        Page<ModerationReview> page = moderationReviewRepository.searchReviews(cleanDecision, cleanSearch, pageable);

        List<AdminModerationItemResponse> items = new ArrayList<>();
        for (ModerationReview review : page.getContent()) {
            AdminModerationItemResponse dto = mapToResponse(review);

            // Lọc theo tier nếu có yêu cầu
            if (StringUtils.hasText(tier)) {
                String targetTier = tier.trim().toUpperCase();
                if (dto.getAiShieldTier() == null || !dto.getAiShieldTier().equalsIgnoreCase(targetTier)) {
                    continue;
                }
            }
            items.add(dto);
        }

        return PageResponse.of(page, items);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminModerationItemResponse getReviewDetail(Long reviewId) {
        ModerationReview review = moderationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phiên kiểm duyệt với ID: " + reviewId));

        return mapToResponse(review);
    }

    @Override
    @Transactional
    public AdminModerationItemResponse processDecision(
            Long reviewId,
            String adminEmail,
            AdminModerationDecisionRequest request
    ) {
        ModerationReview review = moderationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phiên kiểm duyệt với ID: " + reviewId));

        User adminUser = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy tài khoản quản trị viên: " + adminEmail));

        String decision = request.getDecision().trim().toUpperCase();
        if (!"APPROVED".equals(decision) && !"REJECTED".equals(decision)) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Quyết định chỉ có thể là APPROVED hoặc REJECTED");
        }

        Artifact artifact = review.getArtifact();
        if (artifact == null || artifact.getContent() == null) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy nội dung video gắn liền với phiên kiểm duyệt này");
        }

        Content content = artifact.getContent();

        // 1. Cập nhật ModerationReview
        review.setDecision(decision);
        review.setReason(request.getReason().trim());
        review.setModerator(adminUser);
        review.setReviewedAt(Instant.now());
        review = moderationReviewRepository.save(review);

        // 2. Cập nhật Content status
        if ("APPROVED".equals(decision)) {
            content.setStatus(ContentStatus.PUBLISHED.name());
            log.info("Admin '{}' APPROVED video ID '{}' ({})", adminEmail, content.getId(), content.getTitle());
        } else {
            content.setStatus(ContentStatus.REJECTED.name());
            log.info("Admin '{}' REJECTED video ID '{}' ({}) with reason: {}", adminEmail, content.getId(), content.getTitle(), request.getReason());
        }
        content.setUpdatedAt(Instant.now());
        contentRepository.save(content);

        return mapToResponse(review);
    }

    private AdminModerationItemResponse mapToResponse(ModerationReview review) {
        Artifact artifact = review.getArtifact();
        Content content = artifact != null ? artifact.getContent() : null;

        Long contentId = content != null ? content.getId() : null;
        Long channelId = (content != null && content.getChannel() != null) ? content.getChannel().getId() : null;
        String channelName = (content != null && content.getChannel() != null) ? content.getChannel().getName() : null;
        String creatorEmail = (content != null && content.getChannel() != null && content.getChannel().getCreator() != null)
                ? content.getChannel().getCreator().getEmail() : null;

        String title = content != null ? content.getTitle() : null;
        String description = content != null ? content.getTextBody() : null;
        String contentStatus = content != null ? content.getStatus() : null;

        Long artifactId = artifact != null ? artifact.getId() : null;
        String fileUrl = artifact != null ? artifact.getFileUrl() : null;
        String optimizedUrl = artifact != null ? artifact.getOptimizedUrl() : null;
        Integer duration = artifact != null ? artifact.getDurationSeconds() : null;

        // Truy xuất kết quả AI Shield gần nhất cho Artifact này
        Optional<AiFilterLog> aiLogOpt = artifactId != null
                ? aiFilterLogRepository.findTopByArtifactIdOrderByIdDesc(artifactId)
                : Optional.empty();

        String aiShieldTier = null;
        String aiShieldTierLabel = null;
        BigDecimal aiShieldScore = null;
        String aiShieldReason = null;

        if (aiLogOpt.isPresent()) {
            AiFilterLog log = aiLogOpt.get();
            aiShieldTier = log.getResult();
            aiShieldScore = log.getScore();
            aiShieldReason = log.getReason();
            aiShieldTierLabel = resolveTierLabel(aiShieldTier);
        }

        return AdminModerationItemResponse.builder()
                .reviewId(review.getId())
                .artifactId(artifactId)
                .contentId(contentId)
                .channelId(channelId)
                .channelName(channelName)
                .creatorEmail(creatorEmail)
                .title(title)
                .description(description)
                .fileUrl(fileUrl)
                .optimizedUrl(optimizedUrl)
                .durationSeconds(duration)
                .contentStatus(contentStatus)
                .decision(review.getDecision())
                .adminReason(review.getReason())
                .moderatorEmail(review.getModerator() != null ? review.getModerator().getEmail() : null)
                .reviewedAt(review.getReviewedAt())
                .createdAt(artifact != null ? artifact.getCreatedAt() : null)
                .aiShieldTier(aiShieldTier)
                .aiShieldTierLabel(aiShieldTierLabel)
                .aiShieldScore(aiShieldScore)
                .aiShieldReason(aiShieldReason)
                .markdownContent(aiShieldReason) // Chứa báo cáo kịch bản markdown chi tiết
                .build();
    }

    private String resolveTierLabel(String tier) {
        if (tier == null) return null;
        String upper = tier.toUpperCase();
        if (upper.contains("RED") || upper.contains("CRITICAL")) {
            return "Báo động đỏ";
        } else if (upper.contains("FAIR") || upper.contains("WARNING") || upper.contains("KHÁ")) {
            return "Khá";
        } else if (upper.contains("GOOD") || upper.contains("TỐT")) {
            return "Tốt";
        } else if (upper.contains("EXCELLENT") || upper.contains("XUẤT SẮC")) {
            return "Xuất sắc";
        }
        return tier;
    }
}
