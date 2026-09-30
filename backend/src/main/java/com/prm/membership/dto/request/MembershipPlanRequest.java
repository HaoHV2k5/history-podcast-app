package com.prm.membership.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPlanRequest {

    @NotBlank(message = "Tên gói hội viên không được để trống")
    @Size(max = 100, message = "Tên gói hội viên không được vượt quá 100 ký tự")
    private String name;

    @Size(max = 1000, message = "Mô tả gói không được vượt quá 1000 ký tự")
    private String description;

    @NotNull(message = "Mức giá gói không được để trống")
    @DecimalMin(value = "1000", message = "Mức giá tối thiểu là 1.000 VNĐ/tháng")
    private BigDecimal monthlyPrice;

    private List<String> perks;

    private String status; // ACTIVE, INACTIVE
}
