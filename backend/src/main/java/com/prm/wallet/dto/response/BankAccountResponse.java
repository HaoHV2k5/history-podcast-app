package com.prm.wallet.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountResponse {
    private Long id;
    private Long userId;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private Boolean verified;
    private Instant createdAt;
}
