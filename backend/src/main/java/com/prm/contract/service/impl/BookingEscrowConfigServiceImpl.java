package com.prm.contract.service.impl;

import com.prm.common.entity.SystemConfig;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.repository.SystemConfigRepository;
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
    public static final String KEY_TERMS_TEMPLATE = "TERMS_TEMPLATE";

    // General Platform Policy keys stored in system_configs
    public static final String SYS_KEY_MEMBERSHIP_FEE_PERCENT = "MEMBERSHIP_FEE_PERCENT";
    public static final String SYS_KEY_MEMBERSHIP_DURATION_DAYS = "MEMBERSHIP_DURATION_DAYS";
    public static final String SYS_KEY_WITHDRAWAL_SLA_DAYS = "WITHDRAWAL_SLA_DAYS";
    public static final String SYS_KEY_WITHDRAWAL_MIN_AMOUNT = "WITHDRAWAL_MIN_AMOUNT";
    public static final String SYS_KEY_DEPOSIT_MIN_AMOUNT = "DEPOSIT_MIN_AMOUNT";

    private final BookingEscrowConfigRepository configRepository;
    private final BookingEscrowProperties properties;
    private final UserRepository userRepository;
    private final SystemConfigRepository systemConfigRepository;

    @PostConstruct
    public void initSyncFromDb() {
        try {
            log.info("Synchronizing Unified Platform Policy properties from Database...");
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
            configRepository.findByConfigKey(KEY_TERMS_TEMPLATE).ifPresent(c -> properties.setTermsTemplate(c.getConfigValue()));

            systemConfigRepository.findFirstByKeyOrderByIdDesc(SYS_KEY_MEMBERSHIP_FEE_PERCENT)
                    .ifPresent(c -> properties.setMembershipFeePercent(new BigDecimal(c.getValue())));
            systemConfigRepository.findFirstByKeyOrderByIdDesc(SYS_KEY_MEMBERSHIP_DURATION_DAYS)
                    .ifPresent(c -> properties.setMembershipDurationDays(Integer.parseInt(c.getValue())));
            systemConfigRepository.findFirstByKeyOrderByIdDesc(SYS_KEY_WITHDRAWAL_SLA_DAYS)
                    .ifPresent(c -> properties.setWithdrawalSlaDays(Integer.parseInt(c.getValue())));
            systemConfigRepository.findFirstByKeyOrderByIdDesc(SYS_KEY_WITHDRAWAL_MIN_AMOUNT)
                    .ifPresent(c -> properties.setWithdrawalMinAmount(new BigDecimal(c.getValue())));
            systemConfigRepository.findFirstByKeyOrderByIdDesc(SYS_KEY_DEPOSIT_MIN_AMOUNT)
                    .ifPresent(c -> properties.setDepositMinAmount(new BigDecimal(c.getValue())));
            log.info("Unified Platform Policy properties initialized successfully from Database.");
        } catch (Exception e) {
            log.warn("Could not sync Platform Policy configs from DB on startup (table may not be ready yet): {}", e.getMessage());
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
                .membershipFeePercent(properties.getMembershipFeePercent())
                .membershipDurationDays(properties.getMembershipDurationDays())
                .withdrawalSlaDays(properties.getWithdrawalSlaDays())
                .withdrawalMinAmount(properties.getWithdrawalMinAmount())
                .depositMinAmount(properties.getDepositMinAmount())
                .jobIntervalMinutes(properties.getJobIntervalMinutes())
                .termsTemplate(properties.getTermsTemplate())
                .renderedTerms(properties.buildInterpolatedTerms(null))
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
            saveOrUpdateConfig(KEY_CONTRACT_ACCEPT_HOURS, String.valueOf(request.getContractAcceptHours()), "Thời hạn Người đặt hàng phản hồi báo giá hợp đồng (giờ)", admin);
        }
        if (request.getFundHours() != null) {
            properties.setFundHours(request.getFundHours());
            saveOrUpdateConfig(KEY_FUND_HOURS, String.valueOf(request.getFundHours()), "Thời hạn Người đặt hàng nạp tiền ký quỹ cho milestone (giờ)", admin);
        }
        if (request.getFundPauseMaxDays() != null) {
            properties.setFundPauseMaxDays(request.getFundPauseMaxDays());
            saveOrUpdateConfig(KEY_FUND_PAUSE_MAX_DAYS, String.valueOf(request.getFundPauseMaxDays()), "Thời gian ân hạn chờ nạp tiền tối đa trước khi hủy hợp đồng (ngày)", admin);
        }
        if (request.getReviewDays() != null) {
            properties.setReviewDays(request.getReviewDays());
            saveOrUpdateConfig(KEY_REVIEW_DAYS, String.valueOf(request.getReviewDays()), "Thời hạn Người đặt hàng nghiệm thu sản phẩm (ngày)", admin);
        }
        if (request.getReleaseHoldDays() != null) {
            properties.setReleaseHoldDays(request.getReleaseHoldDays());
            saveOrUpdateConfig(KEY_RELEASE_HOLD_DAYS, String.valueOf(request.getReleaseHoldDays()), "Thời gian giữ tiền sau khi duyệt trước khi giải ngân cho Creator (ngày)", admin);
        }
        if (request.getRevisionDays() != null) {
            properties.setRevisionDays(request.getRevisionDays());
            saveOrUpdateConfig(KEY_REVISION_DAYS, String.valueOf(request.getRevisionDays()), "Thời hạn Creator hoàn thành mỗi lần chỉnh sửa sản phẩm (ngày)", admin);
        }
        if (request.getMaxMilestones() != null) {
            properties.setMaxMilestones(request.getMaxMilestones());
            saveOrUpdateConfig(KEY_MAX_MILESTONES, String.valueOf(request.getMaxMilestones()), "Số milestone tối đa trong 1 hợp đồng đặt làm nội dung", admin);
        }
        if (request.getMaxRevisionsDefault() != null) {
            properties.setMaxRevisionsDefault(request.getMaxRevisionsDefault());
            saveOrUpdateConfig(KEY_MAX_REVISIONS_DEFAULT, String.valueOf(request.getMaxRevisionsDefault()), "Số lượt yêu cầu chỉnh sửa mặc định mỗi milestone", admin);
        }
        if (request.getPlatformFeePercent() != null) {
            properties.setPlatformFeePercent(request.getPlatformFeePercent());
            saveOrUpdateConfig(KEY_PLATFORM_FEE_PERCENT, request.getPlatformFeePercent().toString(), "Tỉ lệ phí dịch vụ nền tảng đặt làm nội dung (%)", admin);
        }
        if (request.getMembershipFeePercent() != null) {
            properties.setMembershipFeePercent(request.getMembershipFeePercent());
            saveOrUpdateSystemConfig(SYS_KEY_MEMBERSHIP_FEE_PERCENT, request.getMembershipFeePercent().toString(), admin);
        }
        if (request.getMembershipDurationDays() != null) {
            properties.setMembershipDurationDays(request.getMembershipDurationDays());
            saveOrUpdateSystemConfig(SYS_KEY_MEMBERSHIP_DURATION_DAYS, String.valueOf(request.getMembershipDurationDays()), admin);
        }
        if (request.getWithdrawalSlaDays() != null) {
            properties.setWithdrawalSlaDays(request.getWithdrawalSlaDays());
            saveOrUpdateSystemConfig(SYS_KEY_WITHDRAWAL_SLA_DAYS, String.valueOf(request.getWithdrawalSlaDays()), admin);
        }
        if (request.getWithdrawalMinAmount() != null) {
            properties.setWithdrawalMinAmount(request.getWithdrawalMinAmount());
            saveOrUpdateSystemConfig(SYS_KEY_WITHDRAWAL_MIN_AMOUNT, request.getWithdrawalMinAmount().toPlainString(), admin);
        }
        if (request.getDepositMinAmount() != null) {
            properties.setDepositMinAmount(request.getDepositMinAmount());
            saveOrUpdateSystemConfig(SYS_KEY_DEPOSIT_MIN_AMOUNT, request.getDepositMinAmount().toPlainString(), admin);
        }
        if (request.getJobIntervalMinutes() != null) {
            properties.setJobIntervalMinutes(request.getJobIntervalMinutes());
            saveOrUpdateConfig(KEY_JOB_INTERVAL_MINUTES, String.valueOf(request.getJobIntervalMinutes()), "Chu kỳ chạy job quét hạn tự động (phút)", admin);
        }
        if (request.getTermsTemplate() != null) {
            properties.setTermsTemplate(request.getTermsTemplate());
            saveOrUpdateConfig(KEY_TERMS_TEMPLATE, request.getTermsTemplate(), "Mẫu văn bản điều khoản hợp đồng tiêu chuẩn", admin);
        }

        log.info("Admin {} updated Unified Platform Policy configurations successfully", admin.getEmail());
        return getConfig();
    }

    @Override
    public BookingEscrowConfigResponse resetDefaultConfig() {
        User admin = getCurrentAdminUser();

        properties.setContractAcceptHours(48);
        saveOrUpdateConfig(KEY_CONTRACT_ACCEPT_HOURS, "48", "Thời hạn Người đặt hàng phản hồi báo giá hợp đồng (giờ)", admin);

        properties.setFundHours(48);
        saveOrUpdateConfig(KEY_FUND_HOURS, "48", "Thời hạn Người đặt hàng nạp tiền ký quỹ cho milestone (giờ)", admin);

        properties.setFundPauseMaxDays(7);
        saveOrUpdateConfig(KEY_FUND_PAUSE_MAX_DAYS, "7", "Thời gian ân hạn chờ nạp tiền tối đa trước khi hủy hợp đồng (ngày)", admin);

        properties.setReviewDays(3);
        saveOrUpdateConfig(KEY_REVIEW_DAYS, "3", "Thời hạn Người đặt hàng nghiệm thu sản phẩm (ngày)", admin);

        properties.setReleaseHoldDays(3);
        saveOrUpdateConfig(KEY_RELEASE_HOLD_DAYS, "3", "Thời gian giữ tiền sau khi duyệt trước khi giải ngân cho Creator (ngày)", admin);

        properties.setRevisionDays(2);
        saveOrUpdateConfig(KEY_REVISION_DAYS, "2", "Thời hạn Creator hoàn thành mỗi lần chỉnh sửa sản phẩm (ngày)", admin);

        properties.setMaxMilestones(20);
        saveOrUpdateConfig(KEY_MAX_MILESTONES, "20", "Số milestone tối đa trong 1 hợp đồng đặt làm nội dung", admin);

        properties.setMaxRevisionsDefault(2);
        saveOrUpdateConfig(KEY_MAX_REVISIONS_DEFAULT, "2", "Số lượt yêu cầu chỉnh sửa mặc định mỗi milestone", admin);

        properties.setPlatformFeePercent(new BigDecimal("5.0"));
        saveOrUpdateConfig(KEY_PLATFORM_FEE_PERCENT, "5.0", "Tỉ lệ phí dịch vụ nền tảng đặt làm nội dung (%)", admin);

        properties.setMembershipFeePercent(new BigDecimal("10.0"));
        saveOrUpdateSystemConfig(SYS_KEY_MEMBERSHIP_FEE_PERCENT, "10.0", admin);

        properties.setMembershipDurationDays(30);
        saveOrUpdateSystemConfig(SYS_KEY_MEMBERSHIP_DURATION_DAYS, "30", admin);

        properties.setWithdrawalSlaDays(2);
        saveOrUpdateSystemConfig(SYS_KEY_WITHDRAWAL_SLA_DAYS, "2", admin);

        properties.setWithdrawalMinAmount(new BigDecimal("50000"));
        saveOrUpdateSystemConfig(SYS_KEY_WITHDRAWAL_MIN_AMOUNT, "50000", admin);

        properties.setDepositMinAmount(new BigDecimal("10000"));
        saveOrUpdateSystemConfig(SYS_KEY_DEPOSIT_MIN_AMOUNT, "10000", admin);

        properties.setJobIntervalMinutes(60);
        saveOrUpdateConfig(KEY_JOB_INTERVAL_MINUTES, "60", "Chu kỳ chạy job quét hạn tự động (phút)", admin);

        properties.setTermsTemplate(BookingEscrowProperties.DEFAULT_TERMS_TEMPLATE);
        configRepository.findByConfigKey(KEY_TERMS_TEMPLATE).ifPresent(configRepository::delete);

        log.info("Admin {} reset Unified Platform Policy configurations to defaults", admin.getEmail());
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

    private void saveOrUpdateSystemConfig(String key, String value, User admin) {
        SystemConfig sysConfig = systemConfigRepository.findFirstByKeyOrderByIdDesc(key)
                .orElseGet(() -> SystemConfig.builder().key(key).build());
        sysConfig.setValue(value);
        sysConfig.setUpdatedByUser(admin);
        sysConfig.setUpdatedAt(Instant.now());
        systemConfigRepository.save(sysConfig);
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
