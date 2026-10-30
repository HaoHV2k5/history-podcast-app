package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.contract.dto.request.MilestoneItemRequest;
import com.prm.contract.dto.request.RequestRevisionRequest;
import com.prm.contract.dto.request.SubmitDeliverableRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.dto.response.MilestoneResponse;
import com.prm.contract.service.MilestoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/milestones")
@RequiredArgsConstructor
@Tag(name = "Milestone Management", description = "Vòng lặp Milestone: Chỉnh sửa/Xóa mốc khi thương lượng, Người thuê ký quỹ (Fund), Creator nộp sản phẩm (Submit), Người thuê yêu cầu sửa / duyệt nghiệm thu và hủy quá hạn")
@SecurityRequirement(name = "Bearer Authentication")
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PutMapping("/{id}")
    @Operation(summary = "Creator chỉnh sửa thông tin 1 Milestone khi đang thương lượng",
               description = "Khi hợp đồng đang ở trạng thái PENDING hoặc REJECTED (chưa nạp tiền ký quỹ), Creator có thể sửa tiêu đề, yêu cầu, số tiền, thời gian của 1 milestone. Hệ thống tự tính lại tổng tiền hợp đồng và đặt lại hạn duyệt 48h")
    public ResponseEntity<ApiResponse<MilestoneResponse>> updateMilestone(
            @PathVariable Long id,
            @Valid @RequestBody MilestoneItemRequest request
    ) {
        MilestoneResponse response = milestoneService.updateMilestone(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật milestone thành công! Đã tính lại tổng tiền hợp đồng", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Creator xóa 1 Milestone khi đang thương lượng (ví dụ gộp 2 mốc thành 1)",
               description = "Khi hợp đồng đang ở trạng thái PENDING hoặc REJECTED (chưa nạp tiền ký quỹ) và có từ 2 milestone trở lên, Creator có thể xóa bớt 1 milestone. Hệ thống tự động đánh lại thứ tự orderNo = 1..N và tính lại tổng tiền hợp đồng")
    public ResponseEntity<ApiResponse<ContractResponse>> deleteMilestone(@PathVariable Long id) {
        ContractResponse response = milestoneService.deleteMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa milestone thành công! Đã đánh lại thứ tự và tính lại tổng tiền hợp đồng", response));
    }

    @PostMapping("/{id}/fund")
    @Operation(summary = "Người thuê nạp tiền ký quỹ cho Milestone (Fund Milestone)",
               description = "Trừ tiền từ ví khả dụng của Người đặt nội dung sang Escrow (HELD), Milestone chuyển sang IN_PROGRESS và bắt đầu tính deadline thực hiện cho Creator")
    public ResponseEntity<ApiResponse<MilestoneResponse>> fundMilestone(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.fundMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Ký quỹ milestone thành công! Tiền đã được giữ an toàn trong Escrow", response));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Creator nộp sản phẩm bàn giao cho Milestone",
               description = "Creator gửi nội dung/link sản phẩm hoàn thành, milestone chuyển sang SUBMITTED và hẹn giờ Người thuê nghiệm thu trong 3 ngày")
    public ResponseEntity<ApiResponse<MilestoneResponse>> submitDeliverable(
            @PathVariable Long id,
            @Valid @RequestBody SubmitDeliverableRequest request
    ) {
        MilestoneResponse response = milestoneService.submitDeliverable(id, request);
        return ResponseEntity.ok(ApiResponse.success("Nộp sản phẩm thành công! Chờ Người đặt nội dung nghiệm thu", response));
    }

    @PostMapping("/{id}/request-revision")
    @Operation(summary = "Người thuê yêu cầu chỉnh sửa sản phẩm",
               description = "Người đặt nội dung yêu cầu Creator sửa bài (tối đa 2 lần sửa miễn phí/milestone), milestone chuyển lại IN_PROGRESS với hạn sửa 2 ngày")
    public ResponseEntity<ApiResponse<MilestoneResponse>> requestRevision(
            @PathVariable Long id,
            @Valid @RequestBody RequestRevisionRequest request
    ) {
        MilestoneResponse response = milestoneService.requestRevision(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu chỉnh sửa cho Creator", response));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Người thuê duyệt nghiệm thu Milestone",
               description = "Milestone chuyển sang APPROVED, hệ thống giữ tiền 3 ngày (RELEASE_HOLD_DAYS) trước khi giải ngân 95% về ví Creator, đồng thời mở khóa ngay Milestone tiếp theo sang UNFUNDED")
    public ResponseEntity<ApiResponse<MilestoneResponse>> approveMilestone(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.approveMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Duyệt nghiệm thu milestone thành công! Đã mở khóa giai đoạn tiếp theo", response));
    }

    @PostMapping("/{id}/cancel-overdue")
    @Operation(summary = "Người thuê hủy Milestone trễ hạn & nhận hoàn tiền 100%",
               description = "Nếu Creator trễ deadline bàn giao (IN_PROGRESS quá due_at), Người đặt nội dung được quyền hủy ngay để nhận hoàn 100% tiền ký quỹ của giai đoạn đó về ví")
    public ResponseEntity<ApiResponse<MilestoneResponse>> cancelOverdueMilestone(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.cancelOverdueMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy milestone trễ hạn thành công! 100% tiền ký quỹ của giai đoạn này đã được hoàn về ví của bạn", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một milestone")
    public ResponseEntity<ApiResponse<MilestoneResponse>> getMilestoneById(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.getMilestoneById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/contract/{contractId}")
    @Operation(summary = "Lấy danh sách milestone của hợp đồng")
    public ResponseEntity<ApiResponse<List<MilestoneResponse>>> getMilestonesByContract(@PathVariable Long contractId) {
        List<MilestoneResponse> response = milestoneService.getMilestonesByContract(contractId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
