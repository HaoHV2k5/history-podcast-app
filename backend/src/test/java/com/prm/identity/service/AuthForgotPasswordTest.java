package com.prm.identity.service;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.EmailService;
import com.prm.identity.dto.request.ForgotPasswordRequest;
import com.prm.identity.dto.request.ResetPasswordRequest;
import com.prm.identity.dto.request.VerifyForgotPasswordOtpRequest;
import com.prm.identity.dto.response.VerifyForgotPasswordOtpResponse;
import com.prm.identity.entity.PasswordResetToken;
import com.prm.identity.entity.User;
import com.prm.identity.repository.PasswordResetTokenRepository;
import com.prm.identity.repository.RefreshTokenRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.security.JwtProvider;
import com.prm.identity.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthForgotPasswordTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtProvider jwtProvider;

    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider("PRM_PLATFORM_SUPER_SECRET_KEY_FOR_JWT_SIGNING_2026_VERY_SECURE", 86400000, 604800000);

        authService = new AuthServiceImpl(
                userRepository,
                roleRepository,
                refreshTokenRepository,
                passwordResetTokenRepository,
                emailService,
                passwordEncoder,
                jwtProvider
        );

        sampleUser = User.builder()
                .id(1L)
                .email("test@historypodcast.com")
                .passwordHash("oldEncodedPassword")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("forgotPassword thành công khi email hợp lệ và gửi OTP qua Brevo")
    void forgotPassword_Success() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("test@historypodcast.com")
                .build();

        when(userRepository.findByEmail("test@historypodcast.com")).thenReturn(Optional.of(sampleUser));
        when(passwordResetTokenRepository.findTopByEmailOrderByCreatedAtDesc("test@historypodcast.com"))
                .thenReturn(Optional.empty());

        authService.forgotPassword(request);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository, times(1)).save(tokenCaptor.capture());
        PasswordResetToken savedToken = tokenCaptor.getValue();

        assertNotNull(savedToken);
        assertEquals("test@historypodcast.com", savedToken.getEmail());
        assertNotNull(savedToken.getOtpCode());
        assertEquals(6, savedToken.getOtpCode().length());
        assertFalse(savedToken.getVerified());
        assertFalse(savedToken.getUsed());

        verify(emailService, times(1)).sendPasswordResetOtpEmail(eq("test@historypodcast.com"), eq(savedToken.getOtpCode()));
    }

    @Test
    @DisplayName("forgotPassword ném AppException USER_NOT_FOUND nếu email không tồn tại")
    void forgotPassword_UserNotFound() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("notfound@historypodcast.com")
                .build();

        when(userRepository.findByEmail("notfound@historypodcast.com")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.forgotPassword(request));
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("forgotPassword ném AppException ACCOUNT_INACTIVE_OR_LOCKED nếu tài khoản bị khóa")
    void forgotPassword_UserInactive() {
        sampleUser.setStatus("LOCKED");
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("test@historypodcast.com")
                .build();

        when(userRepository.findByEmail("test@historypodcast.com")).thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () -> authService.forgotPassword(request));
        assertEquals(ErrorCode.ACCOUNT_INACTIVE_OR_LOCKED, ex.getErrorCode());
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("forgotPassword ném AppException OTP_COOLDOWN nếu yêu cầu OTP trong vòng 60s")
    void forgotPassword_Cooldown() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("test@historypodcast.com")
                .build();

        PasswordResetToken recentToken = PasswordResetToken.builder()
                .email("test@historypodcast.com")
                .createdAt(Instant.now().minus(20, ChronoUnit.SECONDS))
                .build();

        when(userRepository.findByEmail("test@historypodcast.com")).thenReturn(Optional.of(sampleUser));
        when(passwordResetTokenRepository.findTopByEmailOrderByCreatedAtDesc("test@historypodcast.com"))
                .thenReturn(Optional.of(recentToken));

        AppException ex = assertThrows(AppException.class, () -> authService.forgotPassword(request));
        assertEquals(ErrorCode.OTP_COOLDOWN, ex.getErrorCode());
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("verifyForgotPasswordOtp thành công trả về resetToken và đánh dấu verified")
    void verifyForgotPasswordOtp_Success() {
        VerifyForgotPasswordOtpRequest request = VerifyForgotPasswordOtpRequest.builder()
                .email("test@historypodcast.com")
                .otpCode("654321")
                .build();

        PasswordResetToken activeToken = PasswordResetToken.builder()
                .id(10L)
                .email("test@historypodcast.com")
                .otpCode("654321")
                .resetToken("mock-reset-token-uuid")
                .expiresAt(Instant.now().plus(4, ChronoUnit.MINUTES))
                .verified(false)
                .used(false)
                .createdAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(passwordResetTokenRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc("test@historypodcast.com"))
                .thenReturn(Optional.of(activeToken));

        VerifyForgotPasswordOtpResponse response = authService.verifyForgotPasswordOtp(request);

        assertNotNull(response);
        assertEquals("test@historypodcast.com", response.getEmail());
        assertEquals("mock-reset-token-uuid", response.getResetToken());
        assertTrue(activeToken.getVerified());
        verify(passwordResetTokenRepository, times(1)).save(activeToken);
    }

    @Test
    @DisplayName("verifyForgotPasswordOtp ném AppException OTP_INVALID nếu mã OTP sai")
    void verifyForgotPasswordOtp_InvalidCode() {
        VerifyForgotPasswordOtpRequest request = VerifyForgotPasswordOtpRequest.builder()
                .email("test@historypodcast.com")
                .otpCode("999999")
                .build();

        PasswordResetToken activeToken = PasswordResetToken.builder()
                .id(10L)
                .email("test@historypodcast.com")
                .otpCode("654321")
                .expiresAt(Instant.now().plus(4, ChronoUnit.MINUTES))
                .verified(false)
                .used(false)
                .build();

        when(passwordResetTokenRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc("test@historypodcast.com"))
                .thenReturn(Optional.of(activeToken));

        AppException ex = assertThrows(AppException.class, () -> authService.verifyForgotPasswordOtp(request));
        assertEquals(ErrorCode.OTP_INVALID, ex.getErrorCode());
        assertFalse(activeToken.getVerified());
    }

    @Test
    @DisplayName("verifyForgotPasswordOtp ném AppException OTP_EXPIRED nếu mã OTP đã quá 5 phút")
    void verifyForgotPasswordOtp_Expired() {
        VerifyForgotPasswordOtpRequest request = VerifyForgotPasswordOtpRequest.builder()
                .email("test@historypodcast.com")
                .otpCode("654321")
                .build();

        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .id(10L)
                .email("test@historypodcast.com")
                .otpCode("654321")
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .verified(false)
                .used(false)
                .build();

        when(passwordResetTokenRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc("test@historypodcast.com"))
                .thenReturn(Optional.of(expiredToken));

        AppException ex = assertThrows(AppException.class, () -> authService.verifyForgotPasswordOtp(request));
        assertEquals(ErrorCode.OTP_EXPIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("resetPassword thành công với resetToken, cập nhật mật khẩu mới và thu hồi Refresh Token cũ")
    void resetPassword_SuccessWithResetToken() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("test@historypodcast.com")
                .resetToken("valid-reset-token")
                .newPassword("NewSecretPass123")
                .confirmPassword("NewSecretPass123")
                .build();

        PasswordResetToken verifiedToken = PasswordResetToken.builder()
                .id(10L)
                .email("test@historypodcast.com")
                .resetToken("valid-reset-token")
                .expiresAt(Instant.now().plus(3, ChronoUnit.MINUTES))
                .verified(true)
                .used(false)
                .build();

        when(passwordResetTokenRepository.findTopByEmailAndResetTokenAndUsedFalseOrderByCreatedAtDesc("test@historypodcast.com", "valid-reset-token"))
                .thenReturn(Optional.of(verifiedToken));
        when(userRepository.findByEmail("test@historypodcast.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("NewSecretPass123")).thenReturn("newHashedPassword");

        authService.resetPassword(request);

        assertEquals("newHashedPassword", sampleUser.getPasswordHash());
        verify(userRepository, times(1)).save(sampleUser);
        assertTrue(verifiedToken.getUsed());
        verify(passwordResetTokenRepository, times(1)).save(verifiedToken);
        verify(refreshTokenRepository, times(1)).revokeAllByUserId(eq(1L), any(Instant.class));
    }

    @Test
    @DisplayName("resetPassword ném AppException PASSWORD_CONFIRM_NOT_MATCH nếu mật khẩu xác nhận không khớp")
    void resetPassword_PasswordConfirmMismatch() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("test@historypodcast.com")
                .resetToken("valid-reset-token")
                .newPassword("NewSecretPass123")
                .confirmPassword("DifferentPass456")
                .build();

        AppException ex = assertThrows(AppException.class, () -> authService.resetPassword(request));
        assertEquals(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword ném AppException RESET_TOKEN_INVALID nếu resetToken chưa được verify")
    void resetPassword_UnverifiedToken() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("test@historypodcast.com")
                .resetToken("unverified-reset-token")
                .newPassword("NewSecretPass123")
                .confirmPassword("NewSecretPass123")
                .build();

        PasswordResetToken unverifiedToken = PasswordResetToken.builder()
                .id(10L)
                .email("test@historypodcast.com")
                .resetToken("unverified-reset-token")
                .expiresAt(Instant.now().plus(3, ChronoUnit.MINUTES))
                .verified(false)
                .used(false)
                .build();

        when(passwordResetTokenRepository.findTopByEmailAndResetTokenAndUsedFalseOrderByCreatedAtDesc("test@historypodcast.com", "unverified-reset-token"))
                .thenReturn(Optional.of(unverifiedToken));

        AppException ex = assertThrows(AppException.class, () -> authService.resetPassword(request));
        assertEquals(ErrorCode.RESET_TOKEN_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("resetPassword thành công với mã OTP trực tiếp")
    void resetPassword_SuccessWithOtpCodeDirectly() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("test@historypodcast.com")
                .otpCode("123456")
                .newPassword("DirectOtpPassword123")
                .confirmPassword("DirectOtpPassword123")
                .build();

        PasswordResetToken tokenWithOtp = PasswordResetToken.builder()
                .id(11L)
                .email("test@historypodcast.com")
                .otpCode("123456")
                .expiresAt(Instant.now().plus(4, ChronoUnit.MINUTES))
                .verified(false)
                .used(false)
                .build();

        when(passwordResetTokenRepository.findTopByEmailAndOtpCodeAndUsedFalseOrderByCreatedAtDesc("test@historypodcast.com", "123456"))
                .thenReturn(Optional.of(tokenWithOtp));
        when(userRepository.findByEmail("test@historypodcast.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("DirectOtpPassword123")).thenReturn("newHashedPasswordDirect");

        authService.resetPassword(request);

        assertEquals("newHashedPasswordDirect", sampleUser.getPasswordHash());
        verify(userRepository, times(1)).save(sampleUser);
        assertTrue(tokenWithOtp.getUsed());
        assertTrue(tokenWithOtp.getVerified());
        verify(refreshTokenRepository, times(1)).revokeAllByUserId(eq(1L), any(Instant.class));
    }
}
