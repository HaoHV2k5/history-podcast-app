package com.prm.wallet.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private Long id;
    private Long userId;
    private BigDecimal availableBalance;
    private BigDecimal pendingBalance;
    private String currency;
    private Instant updatedAt;
}
