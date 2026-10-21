package com.prm.contract.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneRevenueChartPointResponse {

    private String timeBucket;
    private BigDecimal realizedRevenue;
    private BigDecimal voiceRevenue;
    private BigDecimal contentRevenue;
    private BigDecimal grossVolume;
    private Long transactionCount;
}
