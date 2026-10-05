package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.contract.dto.request.RequestRevisionRequest;
import com.prm.contract.dto.request.SubmitDeliverableRequest;
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
@Tag(name = "Milestone Management", description = "Vòng lặp Milestone: Ký quỹ, nộp bài, yêu cầu sửa, duyệt và hủy quá hạn")
@SecurityRequirement(name = "Bearer Authentication")
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PostMapping("/{id}/fund")
    @Operation(summary = "Creator ký quỹ milestone (Fund Milestone)", description = "Trừ tiền từ ví khả dụng của Creator sang Escrow (HELD), Milestone chuyển sang IN_PROGRESS và bắt đầu tính deadline")
    public ResponseEntity<ApiResponse<MilestoneResponse>> fundMilestone(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.fundMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Ký quỹ milestone thành công! Tiền đã được giữ trong Escrow", response));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Freelancer nộp bài milestone", description = "Freelancer tải lên nội dung/file hoàn thành, milestone chuyển sang SUBMITTED và hẹn giờ duyệt trong 3 ngày")
    public ResponseEntity<ApiResponse<MilestoneResponse>> submitDeliverable(
            @PathVariable Long id,
            @Valid @RequestBody SubmitDeliverableRequest request
    ) {
        MilestoneResponse response = milestoneService.submitDeliverable(id, request);
        return ResponseEntity.ok(ApiResponse.success("Nộp sản phẩm thành công! Chờ Creator duyệt", response));
    }

    @PostMapping("/{id}/request-revision")
    @Operation(summary = "Creator yêu cầu chỉnh sửa", description = "Creator yêu cầu sửa bài (trong giới hạn max_revisions), milestone chuyển lại IN_PROGRESS với hạn sửa 2 ngày")
    public ResponseEntity<ApiResponse<MilestoneResponse>> requestRevision(
            @PathVariable Long id,
            @Valid @RequestBody RequestRevisionRequest request
    ) {
        MilestoneResponse response = milestoneService.requestRevision(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu chỉnh sửa cho Freelancer", response));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Creator duyệt milestone", description = "Milestone chuyển sang APPROVED, hệ thống giữ tiền 3 ngày (RELEASE_HOLD_DAYS) trước khi giải ngân, đồng thời kích hoạt Milestone tiếp theo (nếu có)")
    public ResponseEntity<ApiResponse<MilestoneResponse>> approveMilestone(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.approveMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Duyệt milestone thành công! Tiền sẽ tự động giải ngân sau 3 ngày nếu không có khiếu nại", response));
    }

    @PostMapping("/{id}/cancel-overdue")
    @Operation(summary = "Creator hủy milestone trễ hạn", description = "Nếu Freelancer trễ deadline milestone (IN_PROGRESS quá due_at), Creator được quyền hủy milestone & hoàn lại tiền ký quỹ")
    public ResponseEntity<ApiResponse<MilestoneResponse>> cancelOverdueMilestone(@PathVariable Long id) {
        MilestoneResponse response = milestoneService.cancelOverdueMilestone(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy milestone trễ hạn thành công, tiền ký quỹ đã được hoàn về ví của bạn", response));
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
