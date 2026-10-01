package com.prm.identity.service;

import com.prm.identity.dto.request.ForgotPasswordRequest;
import com.prm.identity.dto.request.LoginRequest;
import com.prm.identity.dto.request.RegisterRequest;
import com.prm.identity.dto.request.ResetPasswordRequest;
import com.prm.identity.dto.request.VerifyForgotPasswordOtpRequest;
import com.prm.identity.dto.response.AuthResponse;
import com.prm.identity.dto.response.VerifyForgotPasswordOtpResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);

    /**
     * Gửi mã OTP xác thực quên mật khẩu qua Brevo email
     */
    void forgotPassword(ForgotPasswordRequest request);

    /**
     * Xác thực mã OTP quên mật khẩu và tạo reset token
     */
    VerifyForgotPasswordOtpResponse verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request);

    /**
     * Đặt lại mật khẩu mới bằng reset token hoặc mã OTP hợp lệ
     */
    void resetPassword(ResetPasswordRequest request);
}
