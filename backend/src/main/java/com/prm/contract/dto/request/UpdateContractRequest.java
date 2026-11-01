package com.prm.contract.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateContractRequest {

    @NotBlank(message = "Tiêu đề hợp đồng không được để trống")
    @Size(max = 255, message = "Tiêu đề hợp đồng không vượt quá 255 ký tự")
    @Schema(description = "Tiêu đề hợp đồng đặt làm nội dung", example = "Sản xuất Series 3 tập: Chiến dịch Điện Biên Phủ")
    private String title;

    @Size(max = 5000, message = "Mô tả hợp đồng không vượt quá 5000 ký tự")
    @Schema(description = "Mô tả tổng quan nội dung và phạm vi sản xuất")
    private String description;

    @NotEmpty(message = "Hợp đồng phải có ít nhất 1 milestone")
    @Size(min = 1, max = 20, message = "Hợp đồng hỗ trợ tối thiểu 1 và tối đa 20 giai đoạn (Milestone)")
    @Valid
    @Schema(description = "Danh sách toàn bộ các giai đoạn (Milestone) sau khi hai bên thống nhất trong Chat")
    private List<MilestoneItemRequest> milestones;
}
