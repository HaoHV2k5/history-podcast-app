package com.prm.contract.dto.response;

import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.ServiceType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMilestoneRevenueResponse {

    private Long milestoneId;
    private Integer milestoneOrderNo;
    private String milestoneTitle;

    private Long contractId;
    private String contractTitle;
    private ServiceType serviceType;

    private Long creatorId;
    private String creatorName;
    private String creatorEmail;

    private Long requesterId;
    private String requesterName;
    private String requesterEmail;

    private Long freelancerId;
    private String freelancerName;
    private String freelancerEmail;

    private BigDecimal grossAmount;
    private BigDecimal feePercent;
    private BigDecimal platformFee;
    private BigDecimal netAmount;

    private EscrowStatus status;
    private Instant fundedAt;
    private Instant releasedAt;
    private Instant refundedAt;
}
