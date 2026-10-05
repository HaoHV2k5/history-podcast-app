package com.prm.contract.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenDisputeRequest {

    @NotNull(message = "ID của milestone không được để trống")
    private Long milestoneId;

    @NotBlank(message = "Lý do khiếu nại/tranh chấp không được để trống")
    private String reason;

    private String evidence; // File url hoặc link bằng chứng
}
