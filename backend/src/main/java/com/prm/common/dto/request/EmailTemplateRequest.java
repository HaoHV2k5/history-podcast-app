package com.prm.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu tạo hoặc cập nhật mẫu Email Template")
public class EmailTemplateRequest {

    @NotBlank(message = "Mã template không được để trống")
    @Schema(description = "Mã định danh duy nhất của template", example = "FORGOT_PASSWORD_OTP")
    private String code;

    @NotBlank(message = "Tên template không được để trống")
    @Schema(description = "Tên gợi nhớ của mẫu email", example = "Mã OTP Đặt Lại Mật Khẩu")
    private String name;

    @NotBlank(message = "Tiêu đề email không được để trống")
    @Schema(description = "Tiêu đề email gửi đến người nhận", example = "[History Podcast] Mã OTP đặt lại mật khẩu tài khoản")
    private String subject;

    @NotBlank(message = "Nội dung HTML không được để trống")
    @Schema(description = "Nội dung email định dạng HTML, hỗ trợ các biến dạng {{tên_biến}}", example = "<div>Mã OTP của bạn: {{otpCode}}</div>")
    private String htmlContent;

    @Schema(description = "Mô tả mục đích sử dụng template", example = "Gửi OTP khi quên mật khẩu")
    private String description;

    @Schema(description = "Trạng thái mẫu template (ACTIVE / INACTIVE)", example = "ACTIVE")
    private String status;
}
