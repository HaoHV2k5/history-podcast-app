package com.prm.membership.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.membership.dto.request.MembershipPlanRequest;
import com.prm.membership.dto.response.MembershipPlanResponse;
import com.prm.membership.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/channels/{channelId}/memberships/membership-plans")
@RequiredArgsConstructor
@Tag(name = "Channel Membership Plan Management", description = "Quản lý và cấu hình gói hội viên của kênh Podcast")
public class ChannelPlanController {

    private final MembershipService membershipService;

    @PostMapping
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "1. Creator cấu hình gói hội viên kênh",
            description = "Thiết lập hoặc cập nhật gói hội viên (Upsert). Bắt buộc Creator sở hữu kênh mới có quyền (Anti-IDOR).")
    public ResponseEntity<ApiResponse<MembershipPlanResponse>> upsertChannelPlan(
            @PathVariable Long channelId,
            @Valid @RequestBody MembershipPlanRequest request
    ) {
        MembershipPlanResponse response = membershipService.upsertChannelPlan(channelId, request);
        return ResponseEntity.ok(ApiResponse.success("Cấu hình gói hội viên kênh thành công", response));
    }

    @GetMapping
    @Operation(summary = "2. Xem thông tin gói hội viên công khai của kênh",
            description = "Khán thính giả xem mức giá và các đặc quyền gói hội viên của kênh trước khi đăng ký.")
    public ResponseEntity<ApiResponse<MembershipPlanResponse>> getChannelPlan(
            @PathVariable Long channelId
    ) {
        MembershipPlanResponse response = membershipService.getChannelPlan(channelId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
