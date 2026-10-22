package com.prm.contract.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopRevenueContributorResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String role; // CREATOR | FREELANCER
    private BigDecimal totalAmount;
    private BigDecimal totalPlatformFeeContributed;
    private Long milestonesCount;
}
