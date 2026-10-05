package com.prm.contract.dto.request;

import com.prm.contract.constant.ServiceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContractRequest {

    private Long postId; // Tuỳ chọn, nếu tạo từ bài đăng

    @NotNull(message = "ID của freelancer không được để trống")
    private Long freelancerId;

    @NotNull(message = "Loại dịch vụ (serviceType) không được để trống")
    private ServiceType serviceType;

    @NotBlank(message = "Tiêu đề hợp đồng không được để trống")
    private String title;

    private String description;

    @NotEmpty(message = "Hợp đồng phải có ít nhất 1 milestone")
    @Valid
    private List<MilestoneItemRequest> milestones;
}
