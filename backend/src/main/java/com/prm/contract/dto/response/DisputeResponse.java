package com.prm.contract.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResponse {
    private Long id;
    private Long contractId;
    private Long raisedByUserId;
    private String reason;
    private String status;
    private Long resolvedByUserId;
    private String resolution;
    private Instant resolvedAt;
}
