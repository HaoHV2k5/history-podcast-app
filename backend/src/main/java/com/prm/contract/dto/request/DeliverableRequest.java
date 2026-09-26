package com.prm.contract.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverableRequest {
    private Long contractId;
    private String fileUrl;
    private String status;
    private String reviewNote;
    private Instant submittedAt;
    private Instant reviewedAt;
}
