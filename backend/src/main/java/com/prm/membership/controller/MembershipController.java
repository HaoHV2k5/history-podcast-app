package com.prm.membership.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.membership.dto.response.MembershipCheckResponse;
import com.prm.membership.dto.response.MembershipSubscribeResponse;
import com.prm.membership.dto.response.MyMembershipResponse;
import com.prm.membership.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Membership Management", description = "Quản lý đăng ký hội viên kênh, kiểm tra quyền truy cập và danh sách hội viên")
public class MembershipController {

    private final MembershipService membershipService;

    @PostMapping("/api/v1/channels/{channelId}/memberships/subscribe")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "1. Đăng ký mua gói hội viên kênh",
            description = "Viewer sử dụng số dư ví để đăng ký gói hội viên kênh (30 ngày). Phân chia doanh thu 80% cho Creator, 20% cho nền tảng.")
    public ResponseEntity<ApiResponse<MembershipSubscribeResponse>> subscribe(@PathVariable Long channelId) {
        MembershipSubscribeResponse response = membershipService.subscribe(channelId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký gói hội viên kênh thành công", response));
    }

    @GetMapping("/api/v1/channels/{channelId}/memberships/check")
    @Operation(summary = "2. Kiểm tra quyền hội viên kênh",
            description = "Kiểm tra xem người dùng hiện tại có quyền truy cập nội dung độc quyền của kênh này hay không (là chủ kênh, Admin hoặc hội viên còn hạn).")
    public ResponseEntity<ApiResponse<MembershipCheckResponse>> checkMembership(@PathVariable Long channelId) {
        MembershipCheckResponse response = membershipService.checkMembership(channelId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/v1/memberships/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "3. Xem danh sách các kênh đang là hội viên",
            description = "Viewer xem danh sách các kênh mình đã đăng ký hội viên còn hiệu lực có phân trang.")
    public ResponseEntity<ApiResponse<PageResponse<MyMembershipResponse>>> getMyMemberships(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        PageResponse<MyMembershipResponse> response = membershipService.getMyMemberships(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
