package com.prm.contract.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.contract.dto.request.CreateCommissionRequest;
import com.prm.contract.dto.request.RejectCommissionRequest;
import com.prm.contract.dto.response.CommissionResponse;
import com.prm.contract.service.CommissionService;
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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/commissions", "/api/v1/hire-requests"})
@RequiredArgsConstructor
@Tag(name = "Custom Content Commissions", description = "Người nghe gửi đơn đặt Creator sản xuất Video lẻ (SINGLE_VIDEO) hoặc Series (SERIES), Creator Chấp nhận (mở khóa Chat 1-1) hoặc Từ chối kèm lý do")
@SecurityRequirement(name = "Bearer Authentication")
public class CommissionController {

    private final CommissionService commissionService;

    @PostMapping
    @Operation(summary = "1. Người nghe gửi đơn đặt làm nội dung (Commission)",
               description = "Chỉ cần truyền channelId (hoặc creatorId), contentType (SINGLE_VIDEO | SERIES), title và description. Kiểm tra quy tắc 1 Active Commission tại 1 thời điểm.")
    public ResponseEntity<ApiResponse<CommissionResponse>> create(@Valid @RequestBody CreateCommissionRequest request) {
        CommissionResponse response = commissionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu đặt làm nội dung thành công! Vui lòng chờ Creator phản hồi để mở phòng chat", response));
    }

    @GetMapping("/my-sent")
    @Operation(summary = "2. Người nghe xem danh sách đơn đặt hàng đã gửi (Có phân trang)",
               description = "Lọc theo status (PENDING, ACCEPTED, REJECTED, CONTRACT_SENT, COMPLETED, CANCELLED)")
    public ResponseEntity<ApiResponse<PageResponse<CommissionResponse>>> getMySentRequests(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<CommissionResponse> response = commissionService.getMySentRequests(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-received")
    @Operation(summary = "3. Creator xem danh sách đơn đặt hàng nhận được từ khán giả (Có phân trang)",
               description = "Lọc theo status (PENDING, ACCEPTED, REJECTED, CONTRACT_SENT, COMPLETED, CANCELLED)")
    public ResponseEntity<ApiResponse<PageResponse<CommissionResponse>>> getMyReceivedRequests(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<CommissionResponse> response = commissionService.getMyReceivedRequests(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "4. Xem tất cả đơn đặt hàng liên quan đến tôi (Có phân trang)")
    public ResponseEntity<ApiResponse<PageResponse<CommissionResponse>>> getMyCommissions(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<CommissionResponse> response = commissionService.getMyCommissions(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "5. Lấy danh sách đơn đặt hàng của người dùng hiện tại (Có phân trang)")
    public ResponseEntity<ApiResponse<PageResponse<CommissionResponse>>> getAll(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<CommissionResponse> response = commissionService.getMyCommissions(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "6. Xem chi tiết đơn đặt làm nội dung theo ID")
    public ResponseEntity<ApiResponse<CommissionResponse>> getById(@PathVariable Long id) {
        CommissionResponse response = commissionService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "7. Creator bấm Chấp nhận đơn thảo luận (Mở khóa phòng Chat 1-1)",
               description = "Chuyển trạng thái từ PENDING sang ACCEPTED và cấp mã phòng chat hire_request_{id} để hai bên thương lượng")
    public ResponseEntity<ApiResponse<CommissionResponse>> acceptCommission(@PathVariable Long id) {
        CommissionResponse response = commissionService.acceptCommission(id);
        return ResponseEntity.ok(ApiResponse.success("Đã chấp nhận yêu cầu đặt nội dung! Phòng chat 1-1 đã được mở khóa", response));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "8. Creator bấm Từ chối đơn đặt nội dung (Bắt buộc kèm lý do)",
               description = "Chuyển trạng thái sang REJECTED, lưu lý do từ chối và giải phóng slot ngay để Người nghe có thể đặt kênh khác")
    public ResponseEntity<ApiResponse<CommissionResponse>> rejectCommission(
            @PathVariable Long id,
            @Valid @RequestBody RejectCommissionRequest request
    ) {
        CommissionResponse response = commissionService.rejectCommission(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối yêu cầu đặt làm nội dung", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "9. Người nghe chủ động hủy đơn đặt nội dung (Khi chưa có hợp đồng chạy)",
               description = "Chuyển trạng thái sang CANCELLED và giải phóng slot để Người nghe đặt kênh khác")
    public ResponseEntity<ApiResponse<CommissionResponse>> cancelCommission(@PathVariable Long id) {
        CommissionResponse response = commissionService.cancelCommission(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy yêu cầu đặt làm nội dung thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "10. Người nghe cập nhật nội dung đơn đặt hàng khi còn PENDING")
    public ResponseEntity<ApiResponse<CommissionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateCommissionRequest request
    ) {
        CommissionResponse response = commissionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật yêu cầu đặt nội dung thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "11. Hủy đơn đặt nội dung theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        commissionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy yêu cầu đặt nội dung", null));
    }
}
