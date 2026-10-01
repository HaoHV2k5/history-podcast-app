package com.prm.identity.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prm.common.dto.ApiResponse;
import com.prm.identity.dto.request.ForgotPasswordRequest;
import com.prm.identity.dto.request.ResetPasswordRequest;
import com.prm.identity.dto.request.VerifyForgotPasswordOtpRequest;
import com.prm.identity.dto.response.VerifyForgotPasswordOtpResponse;
import com.prm.identity.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    @DisplayName("POST /forgot-password trả về ApiResponse thành công")
    void testForgotPassword() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("user@example.com")
                .build();

        doNothing().when(authService).forgotPassword(any(ForgotPasswordRequest.class));

        ResponseEntity<ApiResponse<Void>> response = authController.forgotPassword(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn", response.getBody().getMessage());
        verify(authService, times(1)).forgotPassword(request);
    }

    @Test
    @DisplayName("POST /verify-forgot-password-otp trả về reset token khi OTP đúng")
    void testVerifyForgotPasswordOtp() {
        VerifyForgotPasswordOtpRequest request = VerifyForgotPasswordOtpRequest.builder()
                .email("user@example.com")
                .otpCode("123456")
                .build();

        VerifyForgotPasswordOtpResponse expectedResponse = VerifyForgotPasswordOtpResponse.builder()
                .email("user@example.com")
                .resetToken("test-reset-token-uuid")
                .expiresAt(Instant.now().plusSeconds(300))
                .message("Xác thực mã OTP thành công. Vui lòng đặt lại mật khẩu mới")
                .build();

        when(authService.verifyForgotPasswordOtp(any(VerifyForgotPasswordOtpRequest.class)))
                .thenReturn(expectedResponse);

        ResponseEntity<ApiResponse<VerifyForgotPasswordOtpResponse>> response =
                authController.verifyForgotPasswordOtp(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("test-reset-token-uuid", response.getBody().getData().getResetToken());
        verify(authService, times(1)).verifyForgotPasswordOtp(request);
    }

    @Test
    @DisplayName("POST /reset-password trả về ApiResponse thành công khi đổi mật khẩu")
    void testResetPassword() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("user@example.com")
                .resetToken("test-reset-token-uuid")
                .newPassword("NewPassword123")
                .confirmPassword("NewPassword123")
                .build();

        doNothing().when(authService).resetPassword(any(ResetPasswordRequest.class));

        ResponseEntity<ApiResponse<Void>> response = authController.resetPassword(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới", response.getBody().getMessage());
        verify(authService, times(1)).resetPassword(request);
    }
}
