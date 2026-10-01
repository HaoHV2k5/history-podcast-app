package com.prm.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu gửi thử nghiệm email template tới hòm thư chỉ định")
public class EmailTemplateTestSendRequest {

    @NotBlank(message = "Email người nhận không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Schema(description = "Hòm thư nhận email thử nghiệm", example = "admin@historypodcast.com")
    private String toEmail;

    @Schema(description = "Danh sách biến thay thế vào template", example = "{\"otpCode\": \"888999\", \"expiryMinutes\": \"5\"}")
    private Map<String, String> variables;
}
