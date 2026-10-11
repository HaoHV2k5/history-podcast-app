package com.prm.livestream.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.livestream.constant.LivestreamStatus;
import com.prm.livestream.dto.request.CreateLivestreamRequest;
import com.prm.livestream.dto.response.LivestreamResponse;
import com.prm.livestream.dto.response.LivestreamTokenResponse;
import com.prm.livestream.service.LivestreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/livestreams")
@RequiredArgsConstructor
@Tag(name = "Livestream (Agora)", description = "Quản lý phiên phát trực tiếp (Live podcast), cấp token Agora RTC, kiểm tra quyền hội viên VIP")
@SecurityRequirement(name = "Bearer Authentication")
public class LivestreamController {

    private final LivestreamService livestreamService;

    @PostMapping
    @PreAuthorize("hasRole('CREATOR')")
    @Operation(summary = "Tạo phiên livestream mới", description = "Chỉ Creator sở hữu kênh mới có quyền tạo phiên live. Hệ thống khởi tạo phòng và sinh tên Agora Channel")
    public ResponseEntity<ApiResponse<LivestreamResponse>> createSession(@Valid @RequestBody CreateLivestreamRequest request) {
        LivestreamResponse response = livestreamService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo phiên livestream thành công", response));
    }

    @GetMapping
    @Operation(summary = "Danh sách phiên livestream", description = "Lấy danh sách các phiên live có phân trang, lọc theo trạng thái (LIVE/ENDED) hoặc theo kênh")
    public ResponseEntity<ApiResponse<PageResponse<LivestreamResponse>>> getLivestreams(
            @RequestParam(required = false) LivestreamStatus status,
            @RequestParam(required = false) Long channelId,
            @PageableDefault(sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<LivestreamResponse> response = livestreamService.getLivestreams(status, channelId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết phiên livestream", description = "Xem thông tin chi tiết một phiên livestream")
    public ResponseEntity<ApiResponse<LivestreamResponse>> getSession(@PathVariable Long id) {
        LivestreamResponse response = livestreamService.getSession(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/join")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tham gia / Lấy Token kết nối Agora", description = "Creator nhận Token quyền PUBLISHER. Viewer nhận Token quyền SUBSCRIBER (nếu là phòng VIP phải có gói hội viên còn hạn)")
    public ResponseEntity<ApiResponse<LivestreamTokenResponse>> getJoinToken(@PathVariable Long id) {
        LivestreamTokenResponse response = livestreamService.getJoinToken(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy token kết nối Agora thành công", response));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('CREATOR')")
    @Operation(summary = "Kết thúc phiên livestream", description = "Chỉ Creator của phòng live mới có quyền kết thúc phiên phát sóng")
    public ResponseEntity<ApiResponse<LivestreamResponse>> endSession(@PathVariable Long id) {
        LivestreamResponse response = livestreamService.endSession(id);
        return ResponseEntity.ok(ApiResponse.success("Đã kết thúc phiên livestream", response));
    }
}
