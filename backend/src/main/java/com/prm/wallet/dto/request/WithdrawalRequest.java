package com.prm.wallet.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequest {
    private Long walletId;
    private Long bankAccountId;
    private BigDecimal amount;
    private String status;
    private Instant requestedAt;
    private Instant processedAt;
    private String failureReason;
}
