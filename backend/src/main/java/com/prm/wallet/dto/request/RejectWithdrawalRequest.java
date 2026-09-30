package com.prm.wallet.dto.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectWithdrawalRequest {
    private String reason;
}
