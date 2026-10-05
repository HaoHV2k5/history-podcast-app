package com.prm.identity.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.EmailService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.dto.request.ForgotPasswordRequest;
import com.prm.identity.dto.request.LoginRequest;
import com.prm.identity.dto.request.RegisterRequest;
import com.prm.identity.dto.request.ResetPasswordRequest;
import com.prm.identity.dto.request.VerifyForgotPasswordOtpRequest;
import com.prm.identity.dto.response.AuthResponse;
import com.prm.identity.dto.response.VerifyForgotPasswordOtpResponse;
import com.prm.identity.entity.PasswordResetToken;
import com.prm.identity.entity.RefreshToken;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.PasswordResetTokenRepository;
import com.prm.identity.repository.RefreshTokenRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.security.JwtProvider;
import com.prm.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final long OTP_COOLDOWN_SECONDS = 60;
    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng: " + request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, "Số điện thoại đã được sử dụng: " + request.getPhone());
        }

        // Mặc định gán Role VIEWER từ RoleEnum
        Role role = roleRepository.findByName(RoleEnum.VIEWER.name())
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleEnum.VIEWER.name())
                        .description("Default Viewer Role")
                        .build()));

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .role(role)
                .build();
        user.addRole(role);

        User savedUser = userRepository.save(user);

        return createAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new AppException(ErrorCode.ACCOUNT_INACTIVE_OR_LOCKED);
        }

        return createAuthResponse(user);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new AppException(ErrorCode.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }

        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OR_EXPIRED_REFRESH_TOKEN));

        if (Boolean.TRUE.equals(storedToken.getRevoked())) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.INVALID_OR_EXPIRED_REFRESH_TOKEN, "Refresh token đã hết hạn");
        }

        User user = storedToken.getUser();
        java.util.Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(java.util.stream.Collectors.toSet());
        if (roleNames.isEmpty()) {
            roleNames = java.util.Set.of(user.getRole() != null ? user.getRole().getName() : "USER");
        }
        String primaryRole = user.getRole() != null ? user.getRole().getName() : roleNames.iterator().next();
        String newAccessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), roleNames);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(primaryRole)
                .roles(roleNames)
                .build();
    }

    private AuthResponse createAuthResponse(User user) {
        java.util.Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(java.util.stream.Collectors.toSet());
        if (roleNames.isEmpty()) {
            roleNames = java.util.Set.of(user.getRole() != null ? user.getRole().getName() : "USER");
        }
        String primaryRole = user.getRole() != null ? user.getRole().getName() : roleNames.iterator().next();
        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), roleNames);
        String refreshToken = jwtProvider.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(jwtProvider.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(primaryRole)
                .roles(roleNames)
                .build();
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy tài khoản với email: " + normalizedEmail));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new AppException(ErrorCode.ACCOUNT_INACTIVE_OR_LOCKED, "Tài khoản hiện không hoạt động hoặc đang bị tạm khóa");
        }

        // Kiểm tra cooldown giữa các lần yêu cầu OTP (60 giây)
        Optional<PasswordResetToken> latestTokenOpt = passwordResetTokenRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);
        if (latestTokenOpt.isPresent()) {
            PasswordResetToken latest = latestTokenOpt.get();
            long elapsed = Duration.between(latest.getCreatedAt(), Instant.now()).getSeconds();
            if (elapsed < OTP_COOLDOWN_SECONDS) {
                long remaining = OTP_COOLDOWN_SECONDS - elapsed;
                throw new AppException(ErrorCode.OTP_COOLDOWN,
                        "Vui lòng đợi " + remaining + " giây trước khi yêu cầu mã OTP mới");
            }
        }

        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        String resetToken = UUID.randomUUID().toString();

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .email(normalizedEmail)
                .otpCode(otpCode)
                .resetToken(resetToken)
                .expiresAt(Instant.now().plusSeconds(OTP_EXPIRY_SECONDS))
                .verified(false)
                .used(false)
                .createdAt(Instant.now())
                .build();

        passwordResetTokenRepository.save(token);

        // Gửi email chứa mã OTP qua Brevo
        emailService.sendPasswordResetOtpEmail(normalizedEmail, otpCode);
        log.info("Sent password reset OTP via Brevo to email: {}", normalizedEmail);
    }

    @Override
    public VerifyForgotPasswordOtpResponse verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        PasswordResetToken token = passwordResetTokenRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED, "Không tìm thấy yêu cầu đặt lại mật khẩu hợp lệ hoặc mã đã hết hạn"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED, "Mã xác thực OTP đã hết hạn sau 5 phút. Vui lòng gửi lại yêu cầu");
        }

        if (!token.getOtpCode().equals(request.getOtpCode().trim())) {
            throw new AppException(ErrorCode.OTP_INVALID, "Mã OTP không chính xác");
        }

        token.setVerified(true);
        passwordResetTokenRepository.save(token);

        log.info("Verified password reset OTP successfully for email: {}", normalizedEmail);

        return VerifyForgotPasswordOtpResponse.builder()
                .email(normalizedEmail)
                .resetToken(token.getResetToken())
                .expiresAt(token.getExpiresAt())
                .message("Xác thực mã OTP thành công. Vui lòng đặt lại mật khẩu mới")
                .build();
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        PasswordResetToken token;
        if (StringUtils.hasText(request.getResetToken())) {
            token = passwordResetTokenRepository.findTopByEmailAndResetTokenAndUsedFalseOrderByCreatedAtDesc(normalizedEmail, request.getResetToken().trim())
                    .orElseThrow(() -> new AppException(ErrorCode.RESET_TOKEN_INVALID, "Mã xác nhận đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));

            if (!Boolean.TRUE.equals(token.getVerified())) {
                throw new AppException(ErrorCode.RESET_TOKEN_INVALID, "Yêu cầu đặt lại mật khẩu chưa được xác thực OTP thành công");
            }
        } else if (StringUtils.hasText(request.getOtpCode())) {
            token = passwordResetTokenRepository.findTopByEmailAndOtpCodeAndUsedFalseOrderByCreatedAtDesc(normalizedEmail, request.getOtpCode().trim())
                    .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID, "Mã OTP không chính xác hoặc yêu cầu đã được sử dụng"));
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng cung cấp mã OTP hoặc reset token để đặt lại mật khẩu");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED, "Yêu cầu đặt lại mật khẩu đã hết hạn sau 5 phút. Vui lòng thử lại");
        }

        if (Boolean.TRUE.equals(token.getUsed())) {
            throw new AppException(ErrorCode.RESET_TOKEN_ALREADY_USED, "Yêu cầu đặt lại mật khẩu này đã được sử dụng trước đó");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy tài khoản với email: " + normalizedEmail));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        token.setVerified(true);
        passwordResetTokenRepository.save(token);

        // Thu hồi toàn bộ Refresh Token đang hoạt động của user để đảm bảo an toàn
        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());

        log.info("Reset password successfully and revoked existing refresh tokens for user: {}", normalizedEmail);
    }
}
