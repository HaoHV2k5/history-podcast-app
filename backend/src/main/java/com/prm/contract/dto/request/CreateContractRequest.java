package com.prm.contract.dto.request;

import com.prm.contract.constant.ServiceType;
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
public class CreateContractRequest {

    @Schema(description = "ID của đơn yêu cầu đặt nội dung (HireRequest) đã được Creator ACCEPTED", example = "5")
    private Long hireRequestId;

    @Schema(description = "ID người thuê (Listener/Viewer). Có thể bỏ qua nếu đã truyền hireRequestId", example = "2")
    private Long requesterId;

    @Schema(hidden = true)
    private Long freelancerId;

    @Schema(description = "Loại dịch vụ (mặc định là CONTENT nếu không truyền)", example = "CONTENT")
    private ServiceType serviceType;

    @NotBlank(message = "Tiêu đề hợp đồng / lộ trình Milestone không được để trống")
    @Size(max = 255, message = "Tiêu đề hợp đồng không được vượt quá 255 ký tự")
    @Schema(description = "Tiêu đề hợp đồng / dự án", example = "Sản xuất Series 3 tập: Chiến dịch Điện Biên Phủ")
    private String title;

    @Schema(description = "Mô tả phạm vi công việc tổng thể", example = "Sản xuất trọn gói kịch bản, thu âm và hậu kỳ 3 tập video lịch sử")
    private String description;

    @NotEmpty(message = "Hợp đồng phải có ít nhất 1 milestone")
    @Valid
    @Schema(description = "Danh sách các giai đoạn (Milestone) từ 1 đến tối đa 20 mốc")
    private List<MilestoneItemRequest> milestones;

    public Long getEffectiveRequesterId() {
        return requesterId != null ? requesterId : freelancerId;
    }
}
