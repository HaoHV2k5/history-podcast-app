package com.prm.payment.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReturnResponse {
    private String merchantTxnRef;
    private String gatewayTxnNo;
    private BigDecimal amount;
    private String status; // PENDING, SUCCESS, FAILED
    private String message;
}
