package com.prm.membership.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPaymentRequest {
    private Long membershipId;
    private BigDecimal amount;
    private BigDecimal commissionAmount;
    private BigDecimal creatorEarning;
    private String status;
    private Instant paidAt;
}
