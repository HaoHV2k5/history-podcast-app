package com.prm.wallet.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalResponse {
    private Long id;
    private Long walletId;
    private Long bankAccountId;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private BigDecimal amount;
    private String status;
    private Instant requestedAt;
    private Instant processedAt;
    private String failureReason;
}
