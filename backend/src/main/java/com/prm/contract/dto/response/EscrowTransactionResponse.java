package com.prm.contract.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowTransactionResponse {
    private Long id;
    private Long contractId;
    private BigDecimal amount;
    private BigDecimal commissionAmount;
    private String status;
    private Instant lockedAt;
    private Instant releasedAt;
}
