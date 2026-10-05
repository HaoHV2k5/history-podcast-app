package com.prm.contract.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CounterEvidenceRequest {

    @NotBlank(message = "Bằng chứng / nội dung phản hồi không được để trống")
    private String counterEvidence;
}
