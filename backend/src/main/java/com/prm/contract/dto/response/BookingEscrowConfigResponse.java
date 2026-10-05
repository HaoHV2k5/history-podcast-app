package com.prm.contract.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEscrowConfigResponse {

    private int contractAcceptHours;
    private int fundHours;
    private int fundPauseMaxDays;
    private int reviewDays;
    private int releaseHoldDays;
    private int revisionDays;
    private int maxMilestones;
    private int maxRevisionsDefault;
    private BigDecimal platformFeePercent;
    private int jobIntervalMinutes;

    private Instant updatedAt;
    private Long updatedByUserId;
    private String updatedByUserName;
}
