package com.prm.contract.dto.response;

import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneResponse {

    private Long id;
    private Long contractId;
    private Integer orderNo;
    private String title;
    private String requirement;
    private BigDecimal amount;
    private Integer durationDays;
    private Integer maxRevisions;
    private Integer revisionsUsed;
    private MilestoneStatus status;
    private Instant fundDueAt;
    private Instant dueAt;
    private Instant reviewDueAt;
    private Instant releaseAt;
    private EscrowStatus escrowStatus;
    private BigDecimal platformFee;
    private BigDecimal netAmount;
    private Instant fundedAt;
    private Instant releasedAt;
    private Instant refundedAt;
    private List<SubmissionResponse> submissions;
    private List<RevisionRequestResponse> revisionRequests;
    private List<MilestoneDeliverableResponse> deliverables;
    private List<MilestoneReviewResponse> reviews;
    private Instant createdAt;
    private Instant updatedAt;
}
