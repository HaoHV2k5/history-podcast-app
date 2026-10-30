package com.prm.contract.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
    @Schema(description = "Tiêu đề giai đoạn (Milestone)", example = "Giai đoạn 1: Đề cương kịch bản & Tư liệu lịch sử")
    private String title;

    @NotBlank(message = "Yêu cầu sản phẩm bàn giao (requirement) không được để trống")
    @Schema(description = "Sản phẩm bàn giao cam kết ở giai đoạn này", example = "File PDF kịch bản chi tiết và danh mục nguồn sử liệu tham khảo")
    private String requirement;

    @NotNull(message = "Số tiền milestone không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền milestone phải lớn hơn 0")
    @Schema(description = "Số tiền của giai đoạn này (VNĐ)", example = "500000")
    private BigDecimal amount;

    @NotNull(message = "Thời gian thực hiện (durationDays) không được để trống")
    @Min(value = 1, message = "Thời gian thực hiện tối thiểu 1 ngày")
    @Schema(description = "Số ngày cam kết hoàn thành tính từ lúc người thuê nạp tiền ký quỹ (Fund)", example = "5")
    private Integer durationDays;

    @Schema(hidden = true)
    private Integer maxRevisions;

    @Min(value = 1, message = "Thời gian hoàn thành mỗi lần chỉnh sửa (revisionDays) tối thiểu 1 ngày")
    @Schema(hidden = true)
    private Integer revisionDays;
}
