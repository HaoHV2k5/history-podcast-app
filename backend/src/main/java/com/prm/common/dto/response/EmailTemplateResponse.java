package com.prm.common.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin phản hồi mẫu Email Template")
public class EmailTemplateResponse {

    @Schema(description = "ID bản ghi", example = "1")
    private Long id;

    @Schema(description = "Mã định danh template", example = "FORGOT_PASSWORD_OTP")
    private String code;

    @Schema(description = "Tên gợi nhớ của template", example = "Mã OTP Đặt Lại Mật Khẩu")
    private String name;

    @Schema(description = "Tiêu đề email", example = "[History Podcast] Mã OTP đặt lại mật khẩu tài khoản")
    private String subject;

    @Schema(description = "Nội dung email dạng HTML", example = "<div>Mã OTP của bạn: {{otpCode}}</div>")
    private String htmlContent;

    @Schema(description = "Mô tả template", example = "Gửi OTP khi quên mật khẩu")
    private String description;

    @Schema(description = "Trạng thái", example = "ACTIVE")
    private String status;

    @Schema(description = "Thời gian tạo")
    private Instant createdAt;

    @Schema(description = "Thời gian cập nhật gần nhất")
    private Instant updatedAt;
}
