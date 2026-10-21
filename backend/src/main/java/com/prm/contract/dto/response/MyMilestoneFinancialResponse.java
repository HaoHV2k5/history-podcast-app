package com.prm.contract.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyMilestoneFinancialResponse {

    private String role; // FREELANCER | CREATOR

    // Freelancer metrics
    private BigDecimal totalEarned;
    private BigDecimal pendingEarnings;
    private BigDecimal totalPlatformFeePaid;

    // Creator metrics
    private BigDecimal totalSpent;
    private BigDecimal escrowLocked;
    private BigDecimal refundedAmount;

    // Common counts
    private Long completedMilestonesCount;
    private Long activeMilestonesCount;

    // Contract level breakdown
    private List<ContractFinancialBreakdown> contractBreakdowns;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContractFinancialBreakdown {
        private Long contractId;
        private String contractTitle;
        private String otherPartyName;
        private String otherPartyEmail;
        private BigDecimal totalAmount;
        private BigDecimal netAmount;
        private String status;
        private Long completedMilestones;
        private Long totalMilestones;
    }
}
