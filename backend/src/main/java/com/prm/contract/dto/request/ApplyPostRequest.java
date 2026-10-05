package com.prm.contract.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyPostRequest {

    @NotBlank(message = "Lời nhắn ứng tuyển không được để trống")
    private String message;

    @DecimalMin(value = "0.0", inclusive = false, message = "Mức giá đề xuất phải lớn hơn 0")
    private BigDecimal proposedPrice;
}
