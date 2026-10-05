package com.prm.contract.dto.response;

import com.prm.contract.constant.DisputeResult;
import com.prm.contract.constant.DisputeStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResponse {

    private Long id;
    private Long contractId;
    private String contractTitle;
    private Long milestoneId;
    private String milestoneTitle;

    private Long raisedByUserId;
    private String raisedByUserFullName;

    private String reason;
    private String evidence;
    private String counterEvidence;

    private DisputeStatus status;
    private DisputeResult result;
    private BigDecimal splitPercent;

    private Long resolvedByUserId;
    private String resolvedByUserFullName;
    private String resolution;
    private Instant resolvedAt;

    private Instant createdAt;
    private Instant updatedAt;
}
