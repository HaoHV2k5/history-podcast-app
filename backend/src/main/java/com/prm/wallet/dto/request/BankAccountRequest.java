package com.prm.wallet.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountRequest {
    private Long userId;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private Boolean verified;
    private Instant createdAt;
}
