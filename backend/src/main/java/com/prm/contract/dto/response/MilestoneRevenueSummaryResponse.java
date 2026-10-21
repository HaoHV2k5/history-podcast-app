package com.prm.contract.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneRevenueSummaryResponse {

    private BigDecimal totalRealizedRevenue;
    private BigDecimal totalEscrowHeld;
    private BigDecimal totalPendingRevenue;
    private BigDecimal totalGrossVolume;
    private BigDecimal totalRefundedVolume;

    private Long totalMilestonesCount;
    private Long releasedMilestonesCount;
    private Long heldMilestonesCount;
    private Long refundedMilestonesCount;

    private Instant startDate;
    private Instant endDate;
}
