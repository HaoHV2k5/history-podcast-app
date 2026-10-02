package com.prm.channel.dto.request;

import com.prm.common.enums.AiShieldTier;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiShieldPolicyConfigRequest {

    private AiShieldTier tier;

    @NotBlank(message = "Nhãn hiển thị không được để trống")
    private String label;

    @NotNull(message = "Mức điểm tối thiểu không được để trống")
    @DecimalMin(value = "0.00", message = "Mức điểm tối thiểu không được nhỏ hơn 0%")
    @DecimalMax(value = "100.00", message = "Mức điểm tối thiểu không được lớn hơn 100%")
    private BigDecimal minScore;

    @NotNull(message = "Mức điểm tối đa không được để trống")
    @DecimalMin(value = "0.00", message = "Mức điểm tối đa không được nhỏ hơn 0%")
    @DecimalMax(value = "100.00", message = "Mức điểm tối đa không được lớn hơn 100%")
    private BigDecimal maxScore;

    private String description;
    private String actionType;
    private Boolean isActive;
    private Integer displayOrder;
}
