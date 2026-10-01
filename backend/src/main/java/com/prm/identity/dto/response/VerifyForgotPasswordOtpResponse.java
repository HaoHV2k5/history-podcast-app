package com.prm.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Phản hồi xác thực mã OTP quên mật khẩu thành công")
public class VerifyForgotPasswordOtpResponse {

    @Schema(description = "Địa chỉ email", example = "user@example.com")
    private String email;

    @Schema(description = "Token đặt lại mật khẩu dùng cho bước reset-password", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private String resetToken;

    @Schema(description = "Thời gian hết hạn của token", example = "2026-10-01T14:05:00Z")
    private Instant expiresAt;

    @Schema(description = "Thông báo kết quả", example = "Xác thực mã OTP thành công. Vui lòng đặt lại mật khẩu mới")
    private String message;
}
