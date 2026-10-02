package com.prm.channel.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminModerationDecisionRequest {

    @NotBlank(message = "Quyết định không được để trống")
    @Pattern(regexp = "(?i)^(APPROVED|REJECTED)$", message = "Quyết định chỉ có thể là APPROVED (Chấp nhận) hoặc REJECTED (Từ chối)")
    private String decision;

    @NotBlank(message = "Lý do xem xét / giải thích không được để trống")
    private String reason;
}
