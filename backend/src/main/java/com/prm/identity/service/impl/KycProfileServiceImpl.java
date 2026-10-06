package com.prm.identity.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.EmailService;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.dto.request.SendEmailOtpRequest;
import com.prm.identity.dto.request.SubmitKycRequest;
import com.prm.identity.dto.request.UpdateKycStatusRequest;
import com.prm.identity.dto.request.VerifyEmailOtpRequest;
import com.prm.identity.dto.request.VerifyPhoneRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import com.prm.identity.entity.KycProfile;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.mapper.KycProfileMapper;
import com.prm.identity.repository.KycProfileRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.service.KycProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class KycProfileServiceImpl implements KycProfileService {

    private static final int OTP_COOLDOWN_SECONDS = 60;
    private static final int OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final KycProfileRepository repository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final KycProfileMapper mapper;

    @Value("${app.firebase.api-key:}")
    private String firebaseApiKey;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void sendEmailOtp(SendEmailOtpRequest request) {
        User currentUser = getCurrentUser();

        KycProfile profile = repository.findTopByUserIdOrderByIdDesc(currentUser.getId())
                .orElse(null);

        if (profile != null) {
            if ("APPROVED".equalsIgnoreCase(profile.getStatus())) {
                throw new AppException(ErrorCode.KYC_ALREADY_SUBMITTED, "Tài khoản của bạn đã được phê duyệt làm Nhà sáng tạo");
            }
            if (profile.getLastOtpSentAt() != null) {
                long elapsed = Duration.between(profile.getLastOtpSentAt(), Instant.now()).getSeconds();
                if (elapsed < OTP_COOLDOWN_SECONDS) {
                    throw new AppException(ErrorCode.KYC_OTP_COOLDOWN,
                            "Vui lòng đợi " + (OTP_COOLDOWN_SECONDS - elapsed) + " giây trước khi yêu cầu mã OTP mới");
                }
            }
        } else {
            profile = KycProfile.builder()
                    .user(currentUser)
                    .status("DRAFT")
                    .verificationMethod("EMAIL")
                    .build();
        }

        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        profile.setOtpCode(otpCode);
        profile.setLastOtpSentAt(Instant.now());
        profile.setContactEmail(request.getEmail());
        profile.setVerificationMethod("EMAIL");

        repository.save(profile);

        emailService.sendOtpEmail(request.getEmail(), otpCode);
        log.info("Sent email OTP to {} for user {}", request.getEmail(), currentUser.getEmail());
    }

    @Override
    public void verifyEmailOtp(VerifyEmailOtpRequest request) {
        User currentUser = getCurrentUser();

        KycProfile profile = repository.findTopByUserIdOrderByIdDesc(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND, "Không tìm thấy phiên xác thực OTP của bạn"));

        if (!StringUtils.hasText(profile.getContactEmail()) || !profile.getContactEmail().equalsIgnoreCase(request.getEmail().trim())) {
            throw new AppException(ErrorCode.KYC_OTP_INVALID, "Địa chỉ email không khớp với email đã yêu cầu mã OTP");
        }

        if (profile.getOtpCode() == null || profile.getLastOtpSentAt() == null) {
            throw new AppException(ErrorCode.KYC_OTP_INVALID, "Mã OTP không hợp lệ hoặc chưa từng được gửi");
        }

        long elapsed = Duration.between(profile.getLastOtpSentAt(), Instant.now()).getSeconds();
        if (elapsed > OTP_EXPIRY_SECONDS) {
            throw new AppException(ErrorCode.KYC_OTP_INVALID, "Mã OTP đã hết hạn sau 5 phút. Vui lòng gửi lại");
        }

        if (!profile.getOtpCode().equals(request.getOtpCode())) {
            throw new AppException(ErrorCode.KYC_OTP_INVALID, "Mã xác thực OTP không chính xác");
        }

        profile.setOtpVerifiedAt(Instant.now());
        profile.setContactEmail(request.getEmail().trim());
        profile.setOtpCode(null); // Clear OTP after successful verification
        repository.save(profile);

        log.info("Email OTP verified successfully for user {}", currentUser.getEmail());
    }

    @Override
    public void verifyPhone(VerifyPhoneRequest request) {
        User currentUser = getCurrentUser();

        // 1. Xác thực Firebase IdToken qua Google Identity Toolkit API
        String verifiedPhone = verifyFirebaseTokenAndGetPhone(request.getFirebaseToken());

        // 2. Đối chiếu số điện thoại client gửi lên với số điện thoại đã được xác thực từ Firebase
        String normalizedReq = normalizePhoneNumber(request.getPhone());
        String normalizedVerified = normalizePhoneNumber(verifiedPhone);
        if (!normalizedReq.equals(normalizedVerified)) {
            throw new AppException(ErrorCode.PHONE_NUMBER_MISMATCH,
                    "Số điện thoại gửi lên (" + request.getPhone() + ") không khớp với số đã xác thực qua Firebase (" + verifiedPhone + ")");
        }

        KycProfile profile = repository.findTopByUserIdOrderByIdDesc(currentUser.getId())
                .orElseGet(() -> KycProfile.builder()
                        .user(currentUser)
                        .status("DRAFT")
                        .build());

        profile.setPhone(verifiedPhone);
        profile.setVerificationMethod("PHONE");
        profile.setOtpVerifiedAt(Instant.now());
        repository.save(profile);

        // Auto-assign CREATOR role upon phone verification (Cách B)
        Role creatorRole = roleRepository.findByName("CREATOR")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CREATOR")
                        .description("Content Creator Role")
                        .build()));
        currentUser.addRole(creatorRole);
        userRepository.save(currentUser);

        log.info("Phone verification completed successfully for user {} with phone {}, auto-assigned CREATOR role",
                currentUser.getEmail(), verifiedPhone);
    }

    private String verifyFirebaseTokenAndGetPhone(String firebaseToken) {
        if (!StringUtils.hasText(firebaseToken)) {
            throw new AppException(ErrorCode.FIREBASE_TOKEN_INVALID, "Mã xác thực Firebase token không được để trống");
        }

        if (!StringUtils.hasText(firebaseApiKey)) {
            log.error("FIREBASE_API_KEY is not configured");
            throw new AppException(ErrorCode.FIREBASE_TOKEN_INVALID, "Dịch vụ xác thực Firebase chưa được cấu hình trên máy chủ");
        }

        try {
            RestClient restClient = RestClient.builder().build();
            GoogleAccountLookupResponse response = restClient.post()
                    .uri("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={apiKey}", firebaseApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("idToken", firebaseToken))
                    .retrieve()
                    .body(GoogleAccountLookupResponse.class);

            if (response == null || response.users() == null || response.users().isEmpty()) {
                throw new AppException(ErrorCode.FIREBASE_TOKEN_INVALID, "Không tìm thấy thông tin tài khoản ứng với Firebase token này");
            }

            GoogleUserInfo user = response.users().get(0);
            if (!StringUtils.hasText(user.phoneNumber())) {
                throw new AppException(ErrorCode.FIREBASE_TOKEN_INVALID, "Tài khoản Firebase này chưa được xác thực số điện thoại");
            }

            return user.phoneNumber();
        } catch (RestClientResponseException e) {
            log.error("Google Identity Toolkit verification failed: Status {}, Response: {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppException(ErrorCode.FIREBASE_TOKEN_INVALID,
                    "Mã xác thực Firebase (IdToken) không hợp lệ hoặc đã hết hạn");
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Firebase phone verification: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể xác thực số điện thoại qua Firebase lúc này");
        }
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("84") && digits.length() >= 11) {
            digits = "0" + digits.substring(2);
        }
        return digits;
    }

    private record GoogleAccountLookupResponse(List<GoogleUserInfo> users) {}
    private record GoogleUserInfo(String localId, String phoneNumber, String email) {}

    @Override
    public KycProfileResponse submitKyc(SubmitKycRequest request) {
        User currentUser = getCurrentUser();

        KycProfile profile = repository.findTopByUserIdOrderByIdDesc(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.KYC_OTP_NOT_VERIFIED,
                        "Vui lòng hoàn tất xác thực OTP email hoặc số điện thoại trước khi nộp hồ sơ"));

        if (profile.getOtpVerifiedAt() == null) {
            throw new AppException(ErrorCode.KYC_OTP_NOT_VERIFIED,
                    "Vui lòng hoàn tất xác thực OTP email hoặc số điện thoại trước khi nộp hồ sơ");
        }

        if ("APPROVED".equalsIgnoreCase(profile.getStatus())) {
            throw new AppException(ErrorCode.KYC_ALREADY_SUBMITTED, "Hồ sơ của bạn đã được phê duyệt làm Nhà sáng tạo");
        }
        if ("PENDING".equalsIgnoreCase(profile.getStatus())) {
            throw new AppException(ErrorCode.KYC_ALREADY_SUBMITTED, "Hồ sơ của bạn đang được quản trị viên xử lý");
        }

        // Preserve verified contact identity and prevent overwriting with untrusted data
        if ("EMAIL".equalsIgnoreCase(profile.getVerificationMethod())) {
            if (StringUtils.hasText(request.getContactEmail()) &&
                    !request.getContactEmail().trim().equalsIgnoreCase(profile.getContactEmail())) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA,
                        "Email liên hệ phải trùng khớp với email đã xác thực OTP (" + profile.getContactEmail() + ")");
            }
            if (StringUtils.hasText(request.getPhone())) {
                profile.setPhone(request.getPhone().trim());
            }
        } else if ("PHONE".equalsIgnoreCase(profile.getVerificationMethod())) {
            if (StringUtils.hasText(request.getPhone()) &&
                    !normalizePhoneNumber(request.getPhone()).equals(normalizePhoneNumber(profile.getPhone()))) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA,
                        "Số điện thoại gửi lên phải trùng khớp với số điện thoại đã xác thực (" + profile.getPhone() + ")");
            }
            if (StringUtils.hasText(request.getContactEmail())) {
                profile.setContactEmail(request.getContactEmail().trim());
            }
        }

        profile.setFullName(request.getFullName());
        profile.setBankName(request.getBankName());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setBankAccountHolder(request.getBankAccountHolder());
        profile.setBio(request.getBio());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        profile.setStatus("PENDING");
        profile.setRejectionReason(null);

        KycProfile saved = repository.save(profile);
        log.info("Submitted KYC profile ID {} for user {}", saved.getId(), currentUser.getEmail());
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public KycProfileResponse getMyKycProfile() {
        User currentUser = getCurrentUser();
        KycProfile profile = repository.findTopByUserIdOrderByIdDesc(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND, "Bạn chưa có hồ sơ KYC nào"));
        return mapper.toResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<KycProfileResponse> getKycProfiles(String status, Pageable pageable) {
        String sanitizedStatus = StringUtils.hasText(status) ? status.trim().toUpperCase() : null;
        Page<KycProfile> page = repository.findByStatusFilter(sanitizedStatus, pageable);
        return PageResponse.of(page, page.getContent().stream().map(mapper::toResponse).toList());
    }

    @Override
    public KycProfileResponse updateKycStatus(Long id, UpdateKycStatusRequest request) {
        KycProfile profile = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND, "Không tìm thấy hồ sơ KYC với ID: " + id));

        String targetStatus = request.getStatus().toUpperCase();
        if ("APPROVED".equals(targetStatus)) {
            profile.setStatus("APPROVED");
            profile.setRejectionReason(null);

            // Automatically upgrade user role to CREATOR
            User user = profile.getUser();
            if (user != null) {
                Role creatorRole = roleRepository.findByName("CREATOR")
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Không tìm thấy vai trò CREATOR trong hệ thống"));
                user.addRole(creatorRole);
                userRepository.save(user);
                log.info("Upgraded user {} to role CREATOR following KYC approval", user.getEmail());
            }
        } else if ("REJECTED".equals(targetStatus)) {
            if (!StringUtils.hasText(request.getRejectionReason())) {
                throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng nhập lý do từ chối hồ sơ KYC");
            }
            profile.setStatus("REJECTED");
            profile.setRejectionReason(request.getRejectionReason().trim());
            log.info("Rejected KYC profile ID {} with reason: {}", id, request.getRejectionReason());
        } else {
            throw new AppException(ErrorCode.KYC_INVALID_STATUS, "Trạng thái chỉ có thể là APPROVED hoặc REJECTED");
        }

        KycProfile saved = repository.save(profile);
        return mapper.toResponse(saved);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
    }
}
