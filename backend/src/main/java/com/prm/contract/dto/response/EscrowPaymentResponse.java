package com.prm.contract.dto.response;

import com.prm.contract.constant.EscrowStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowPaymentResponse {

    private Long id;
    private Long milestoneId;
    private BigDecimal amount;
    private BigDecimal platformFee;
    private BigDecimal netAmount;
    private EscrowStatus status;
    private Instant fundedAt;
    private Instant releasedAt;
    private Instant refundedAt;
}
