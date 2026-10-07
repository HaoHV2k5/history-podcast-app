package com.prm.contract.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.dto.request.BookingEscrowConfigRequest;
import com.prm.contract.dto.response.BookingEscrowConfigResponse;
import com.prm.contract.entity.BookingEscrowConfig;
import com.prm.contract.repository.BookingEscrowConfigRepository;
import com.prm.contract.service.BookingEscrowConfigService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BookingEscrowConfigServiceImpl implements BookingEscrowConfigService {

    public static final String KEY_CONTRACT_ACCEPT_HOURS = "CONTRACT_ACCEPT_HOURS";
    public static final String KEY_FUND_HOURS = "FUND_HOURS";
    public static final String KEY_FUND_PAUSE_MAX_DAYS = "FUND_PAUSE_MAX_DAYS";
    public static final String KEY_REVIEW_DAYS = "REVIEW_DAYS";
    public static final String KEY_RELEASE_HOLD_DAYS = "RELEASE_HOLD_DAYS";
    public static final String KEY_REVISION_DAYS = "REVISION_DAYS";
    public static final String KEY_MAX_MILESTONES = "MAX_MILESTONES";
    public static final String KEY_MAX_REVISIONS_DEFAULT = "MAX_REVISIONS_DEFAULT";
    public static final String KEY_PLATFORM_FEE_PERCENT = "PLATFORM_FEE_PERCENT";
    public static final String KEY_JOB_INTERVAL_MINUTES = "JOB_INTERVAL_MINUTES";

    private final BookingEscrowConfigRepository configRepository;
    private final BookingEscrowProperties properties;
    private final UserRepository userRepository;

    @PostConstruct
    public void initSyncFromDb() {
        try {
            log.info("Synchronizing BookingEscrow properties from Database...");
            configRepository.findByConfigKey(KEY_CONTRACT_ACCEPT_HOURS).ifPresent(c -> properties.setContractAcceptHours(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_FUND_HOURS).ifPresent(c -> properties.setFundHours(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_FUND_PAUSE_MAX_DAYS).ifPresent(c -> properties.setFundPauseMaxDays(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_REVIEW_DAYS).ifPresent(c -> properties.setReviewDays(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_RELEASE_HOLD_DAYS).ifPresent(c -> properties.setReleaseHoldDays(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_REVISION_DAYS).ifPresent(c -> properties.setRevisionDays(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_MAX_MILESTONES).ifPresent(c -> properties.setMaxMilestones(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_MAX_REVISIONS_DEFAULT).ifPresent(c -> properties.setMaxRevisionsDefault(Integer.parseInt(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_PLATFORM_FEE_PERCENT).ifPresent(c -> properties.setPlatformFeePercent(new BigDecimal(c.getConfigValue())));
            configRepository.findByConfigKey(KEY_JOB_INTERVAL_MINUTES).ifPresent(c -> properties.setJobIntervalMinutes(Integer.parseInt(c.getConfigValue())));
            log.info("BookingEscrow properties initialized successfully from Database.");
        } catch (Exception e) {
            log.warn("Could not sync BookingEscrow configs from DB on startup (table may not be ready yet): {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public BookingEscrowConfigResponse getConfig() {
        BookingEscrowConfig latestUpdated = configRepository.findAll().stream()
                .filter(c -> c.getUpdatedAt() != null)
                .max((c1, c2) -> c1.getUpdatedAt().compareTo(c2.getUpdatedAt()))
                .orElse(null);

        return BookingEscrowConfigResponse.builder()
                .contractAcceptHours(properties.getContractAcceptHours())
                .fundHours(properties.getFundHours())
                .fundPauseMaxDays(properties.getFundPauseMaxDays())
                .reviewDays(properties.getReviewDays())
                .releaseHoldDays(properties.getReleaseHoldDays())
                .revisionDays(properties.getRevisionDays())
                .maxMilestones(properties.getMaxMilestones())
                .maxRevisionsDefault(properties.getMaxRevisionsDefault())
                .platformFeePercent(properties.getPlatformFeePercent())
                .jobIntervalMinutes(properties.getJobIntervalMinutes())
                .updatedAt(latestUpdated != null ? latestUpdated.getUpdatedAt() : Instant.now())
                .updatedByUserId(latestUpdated != null && latestUpdated.getUpdatedBy() != null ? latestUpdated.getUpdatedBy().getId() : null)
                .updatedByUserName(latestUpdated != null && latestUpdated.getUpdatedBy() != null ? latestUpdated.getUpdatedBy().getFullName() : "SYSTEM")
                .build();
    }

    @Override
    public BookingEscrowConfigResponse updateConfig(BookingEscrowConfigRequest request) {
        User admin = getCurrentAdminUser();

        if (request.getContractAcceptHours() != null) {
            properties.setContractAcceptHours(request.getContractAcceptHours());
            saveOrUpdateConfig(KEY_CONTRACT_ACCEPT_HOURS, String.valueOf(request.getContractAcceptHours()), "Thời hạn Freelancer phản hồi hợp đồng (giờ)", admin);
        }
        if (request.getFundHours() != null) {
            properties.setFundHours(request.getFundHours());
            saveOrUpdateConfig(KEY_FUND_HOURS, String.valueOf(request.getFundHours()), "Thời hạn Creator ký quỹ cho milestone (giờ)", admin);
        }
        if (request.getFundPauseMaxDays() != null) {
            properties.setFundPauseMaxDays(request.getFundPauseMaxDays());
            saveOrUpdateConfig(KEY_FUND_PAUSE_MAX_DAYS, String.valueOf(request.getFundPauseMaxDays()), "Thời gian tạm dừng tối đa trước khi hủy hợp đồng (ngày)", admin);
        }
        if (request.getReviewDays() != null) {
            properties.setReviewDays(request.getReviewDays());
            saveOrUpdateConfig(KEY_REVIEW_DAYS, String.valueOf(request.getReviewDays()), "Thời hạn Creator duyệt sản phẩm (ngày)", admin);
        }
        if (request.getReleaseHoldDays() != null) {
            properties.setReleaseHoldDays(request.getReleaseHoldDays());
            saveOrUpdateConfig(KEY_RELEASE_HOLD_DAYS, String.valueOf(request.getReleaseHoldDays()), "Thời gian giữ tiền sau duyệt trước khi giải ngân (ngày)", admin);
        }
        if (request.getRevisionDays() != null) {
            properties.setRevisionDays(request.getRevisionDays());
            saveOrUpdateConfig(KEY_REVISION_DAYS, String.valueOf(request.getRevisionDays()), "Thời hạn Freelancer chỉnh sửa sản phẩm (ngày)", admin);
        }
        if (request.getMaxMilestones() != null) {
            properties.setMaxMilestones(request.getMaxMilestones());
            saveOrUpdateConfig(KEY_MAX_MILESTONES, String.valueOf(request.getMaxMilestones()), "Số milestone tối đa trong 1 hợp đồng", admin);
        }
        if (request.getMaxRevisionsDefault() != null) {
            properties.setMaxRevisionsDefault(request.getMaxRevisionsDefault());
            saveOrUpdateConfig(KEY_MAX_REVISIONS_DEFAULT, String.valueOf(request.getMaxRevisionsDefault()), "Số lượt yêu cầu chỉnh sửa mặc định mỗi milestone", admin);
        }
        if (request.getPlatformFeePercent() != null) {
            properties.setPlatformFeePercent(request.getPlatformFeePercent());
            saveOrUpdateConfig(KEY_PLATFORM_FEE_PERCENT, request.getPlatformFeePercent().toString(), "Tỉ lệ phí nền tảng khấu trừ (%)", admin);
        }
        if (request.getJobIntervalMinutes() != null) {
            properties.setJobIntervalMinutes(request.getJobIntervalMinutes());
            saveOrUpdateConfig(KEY_JOB_INTERVAL_MINUTES, String.valueOf(request.getJobIntervalMinutes()), "Chu kỳ chạy job quét hạn (phút)", admin);
        }

        log.info("Admin {} updated BookingEscrow configurations successfully", admin.getEmail());
        return getConfig();
    }

    @Override
    public BookingEscrowConfigResponse resetDefaultConfig() {
        User admin = getCurrentAdminUser();

        properties.setContractAcceptHours(48);
        saveOrUpdateConfig(KEY_CONTRACT_ACCEPT_HOURS, "48", "Thời hạn Freelancer phản hồi hợp đồng (giờ)", admin);

        properties.setFundHours(48);
        saveOrUpdateConfig(KEY_FUND_HOURS, "48", "Thời hạn Creator ký quỹ cho milestone (giờ)", admin);

        properties.setFundPauseMaxDays(7);
        saveOrUpdateConfig(KEY_FUND_PAUSE_MAX_DAYS, "7", "Thời gian tạm dừng tối đa trước khi hủy hợp đồng (ngày)", admin);

        properties.setReviewDays(3);
        saveOrUpdateConfig(KEY_REVIEW_DAYS, "3", "Thời hạn Creator duyệt sản phẩm (ngày)", admin);

        properties.setReleaseHoldDays(3);
        saveOrUpdateConfig(KEY_RELEASE_HOLD_DAYS, "3", "Thời gian giữ tiền sau duyệt trước khi giải ngân (ngày)", admin);

        properties.setRevisionDays(2);
        saveOrUpdateConfig(KEY_REVISION_DAYS, "2", "Thời hạn Freelancer chỉnh sửa sản phẩm (ngày)", admin);

        properties.setMaxMilestones(5);
        saveOrUpdateConfig(KEY_MAX_MILESTONES, "5", "Số milestone tối đa trong 1 hợp đồng", admin);

        properties.setMaxRevisionsDefault(2);
        saveOrUpdateConfig(KEY_MAX_REVISIONS_DEFAULT, "2", "Số lượt yêu cầu chỉnh sửa mặc định mỗi milestone", admin);

        properties.setPlatformFeePercent(new BigDecimal("5.0"));
        saveOrUpdateConfig(KEY_PLATFORM_FEE_PERCENT, "5.0", "Tỉ lệ phí nền tảng khấu trừ (%)", admin);

        properties.setJobIntervalMinutes(60);
        saveOrUpdateConfig(KEY_JOB_INTERVAL_MINUTES, "60", "Chu kỳ chạy job quét hạn (phút)", admin);

        log.info("Admin {} reset BookingEscrow configurations to defaults", admin.getEmail());
        return getConfig();
    }

    private void saveOrUpdateConfig(String key, String value, String description, User admin) {
        BookingEscrowConfig entity = configRepository.findByConfigKey(key)
                .orElseGet(() -> BookingEscrowConfig.builder().configKey(key).build());
        entity.setConfigValue(value);
        entity.setDescription(description);
        entity.setUpdatedBy(admin);
        entity.setUpdatedAt(Instant.now());
        configRepository.save(entity);
    }

    private User getCurrentAdminUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
        if (!user.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Quản trị viên (Admin) mới có quyền cấu hình thông số sàn");
        }
        return user;
    }
}
