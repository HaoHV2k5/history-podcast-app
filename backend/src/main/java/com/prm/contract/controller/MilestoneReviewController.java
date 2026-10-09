package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.contract.dto.request.CreateMilestoneReviewRequest;
import com.prm.contract.dto.response.MilestoneReviewResponse;
import com.prm.contract.service.MilestoneReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Milestone Reviews", description = "Đánh giá chất lượng và tiến độ theo từng giai đoạn Milestone")
@SecurityRequirement(name = "Bearer Authentication")
public class MilestoneReviewController {

    private final MilestoneReviewService milestoneReviewService;

    @PostMapping("/api/v1/milestones/{milestoneId}/reviews")
    @Operation(summary = "Đánh giá giai đoạn Milestone",
            description = "Creator hoặc Freelancer đánh giá (1-5 sao, nhận xét) sau khi Milestone đã được duyệt (APPROVED) hoặc giải ngân (RELEASED)")
    public ResponseEntity<ApiResponse<MilestoneReviewResponse>> createMilestoneReview(
            @PathVariable Long milestoneId,
            @Valid @RequestBody CreateMilestoneReviewRequest request
    ) {
        MilestoneReviewResponse response = milestoneReviewService.createMilestoneReview(milestoneId, request);
        return ResponseEntity.ok(ApiResponse.success("Đánh giá giai đoạn thành công!", response));
    }

    @GetMapping("/api/v1/milestones/{milestoneId}/reviews")
    @Operation(summary = "Lấy danh sách đánh giá của một Milestone",
            description = "Xem phản hồi, số sao và nhận xét của giai đoạn Milestone")
    public ResponseEntity<ApiResponse<List<MilestoneReviewResponse>>> getReviewsByMilestone(
            @PathVariable Long milestoneId
    ) {
        List<MilestoneReviewResponse> list = milestoneReviewService.getReviewsByMilestone(milestoneId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/api/v1/contracts/{contractId}/milestone-reviews")
    @Operation(summary = "Lấy danh sách đánh giá tất cả các Milestone trong hợp đồng",
            description = "Tổng hợp đánh giá từng giai đoạn của toàn bộ hợp đồng")
    public ResponseEntity<ApiResponse<List<MilestoneReviewResponse>>> getReviewsByContract(
            @PathVariable Long contractId
    ) {
        List<MilestoneReviewResponse> list = milestoneReviewService.getReviewsByContract(contractId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
