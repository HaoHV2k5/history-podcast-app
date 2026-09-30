package com.prm.payment.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDepositRequest {

    @NotNull(message = "Số tiền nạp không được để trống")
    @Min(value = 10000, message = "Số tiền nạp tối thiểu là 10.000 VNĐ")
    private Long amount;

    private String description;
}
