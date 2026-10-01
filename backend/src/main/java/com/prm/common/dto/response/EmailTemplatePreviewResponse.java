package com.prm.common.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Nội dung email sau khi đã render biến giả lập")
public class EmailTemplatePreviewResponse {

    @Schema(description = "Tiêu đề email sau khi thay thế biến", example = "[History Podcast] Mã OTP đặt lại mật khẩu tài khoản")
    private String subject;

    @Schema(description = "Nội dung mã HTML sau khi thay thế biến", example = "<div>Mã OTP của bạn là 123456</div>")
    private String htmlContent;
}
