package com.prm.identity.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.identity.dto.request.ForgotPasswordRequest;
import com.prm.identity.dto.request.LoginRequest;
import com.prm.identity.dto.request.RegisterRequest;
import com.prm.identity.dto.request.ResetPasswordRequest;
import com.prm.identity.dto.request.VerifyForgotPasswordOtpRequest;
import com.prm.identity.dto.response.AuthResponse;
import com.prm.identity.dto.response.VerifyForgotPasswordOtpResponse;
import com.prm.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs xác thực người dùng (Đăng ký, Đăng nhập, Refresh Token, Quên mật khẩu qua Brevo OTP)")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới", description = "Tạo tài khoản người dùng với mật khẩu mã hóa BCrypt và trả về JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập tài khoản", description = "Kiểm tra email và mật khẩu bằng BCrypt, trả về JWT Access Token và Refresh Token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token", description = "Cấp lại Access Token mới từ Refresh Token hợp lệ")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestParam String refreshToken) {
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu mã OTP quên mật khẩu", description = "Tạo mã OTP 6 chữ số và gửi qua Brevo email tới người dùng để đặt lại mật khẩu")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn", null));
    }

    @PostMapping("/verify-forgot-password-otp")
    @Operation(summary = "Xác thực mã OTP quên mật khẩu", description = "Kiểm tra mã OTP 6 chữ số hợp lệ và trả về reset token dùng để đổi mật khẩu")
    public ResponseEntity<ApiResponse<VerifyForgotPasswordOtpResponse>> verifyForgotPasswordOtp(
            @Valid @RequestBody VerifyForgotPasswordOtpRequest request) {
        VerifyForgotPasswordOtpResponse response = authService.verifyForgotPasswordOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực mã OTP thành công", response));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu mới", description = "Cập nhật mật khẩu mới bằng reset token hoặc mã OTP, đồng thời thu hồi mọi Refresh Token cũ")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới", null));
    }
}
