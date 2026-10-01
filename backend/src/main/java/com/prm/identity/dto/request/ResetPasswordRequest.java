package com.prm.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu đặt lại mật khẩu mới")
public class ResetPasswordRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Schema(description = "Địa chỉ email của tài khoản", example = "user@example.com")
    private String email;

    @Schema(description = "Token đặt lại mật khẩu (nhận được sau khi xác thực OTP thành công)", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private String resetToken;

    @Schema(description = "Mã xác thực OTP (nếu không dùng reset token)", example = "123456")
    private String otpCode;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, message = "Mật khẩu mới phải có tối thiểu 6 ký tự")
    @Schema(description = "Mật khẩu mới", example = "Password@123")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    @Schema(description = "Xác nhận lại mật khẩu mới", example = "Password@123")
    private String confirmPassword;
}
