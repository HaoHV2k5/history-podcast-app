package com.prm.membership.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPaymentResponse {
    private Long id;
    private Long membershipId;
    private BigDecimal amount;
    private BigDecimal commissionAmount;
    private BigDecimal creatorEarning;
    private String status;
    private Instant paidAt;
}
