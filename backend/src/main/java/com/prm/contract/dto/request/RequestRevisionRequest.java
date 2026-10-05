package com.prm.contract.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestRevisionRequest {

    private Long submissionId;

    @NotBlank(message = "Lý do / yêu cầu chỉnh sửa không được để trống")
    private String note;
}
