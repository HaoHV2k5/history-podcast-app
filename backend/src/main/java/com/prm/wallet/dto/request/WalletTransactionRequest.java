package com.prm.wallet.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransactionRequest {
    private Long walletId;
    private String type;
    private BigDecimal amount;
    private String relatedType;
    private Long relatedId;
    private String status;
    private Instant createdAt;
}
