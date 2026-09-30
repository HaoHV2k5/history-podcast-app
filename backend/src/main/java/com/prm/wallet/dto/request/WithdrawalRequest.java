package com.prm.wallet.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequest {

    private Long bankAccountId;

    @NotNull(message = "Số tiền rút không được để trống")
    @DecimalMin(value = "50000", message = "Số tiền rút tối thiểu là 50.000 VNĐ")
    private BigDecimal amount;
}
