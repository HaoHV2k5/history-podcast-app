package com.prm.contract.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneItemRequest {

    @NotBlank(message = "Tiêu đề milestone không được để trống")
    private String title;

    @NotBlank(message = "Yêu cầu cần giao (requirement) không được để trống")
    private String requirement;

    @NotNull(message = "Số tiền milestone không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền milestone phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Thời gian thực hiện (durationDays) không được để trống")
    @Min(value = 1, message = "Thời gian thực hiện tối thiểu 1 ngày")
    private Integer durationDays;

    private Integer maxRevisions; // Số lần sửa tối đa, mặc định theo config nếu null

    @Min(value = 1, message = "Thời gian hoàn thành mỗi lần chỉnh sửa (revisionDays) tối thiểu 1 ngày")
    private Integer revisionDays; // Số ngày cho mỗi lần chỉnh sửa, mặc định theo config sàn nếu null
}
