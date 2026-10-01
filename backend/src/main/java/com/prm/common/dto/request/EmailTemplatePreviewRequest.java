package com.prm.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu xem trước email template kèm biến giả lập")
public class EmailTemplatePreviewRequest {

    @Schema(description = "Danh sách các biến giả lập để thay thế vào template (ví dụ: otpCode: 123456)", example = "{\"otpCode\": \"123456\", \"expiryMinutes\": \"5\"}")
    private Map<String, String> variables;
}
