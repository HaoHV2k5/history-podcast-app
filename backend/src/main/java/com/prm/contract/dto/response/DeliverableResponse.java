package com.prm.contract.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverableResponse {
    private Long id;
    private Long contractId;
    private String fileUrl;
    private String status;
    private String reviewNote;
    private Instant submittedAt;
    private Instant reviewedAt;
}
