package com.prm.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu xác thực mã OTP quên mật khẩu")
public class VerifyForgotPasswordOtpRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Schema(description = "Địa chỉ email đã yêu cầu OTP", example = "user@example.com")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải gồm đúng 6 chữ số")
    @Schema(description = "Mã xác thực OTP gồm 6 chữ số", example = "123456")
    private String otpCode;
}
