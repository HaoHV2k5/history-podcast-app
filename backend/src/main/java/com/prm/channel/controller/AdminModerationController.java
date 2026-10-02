package com.prm.channel.controller;

import com.prm.channel.dto.request.AdminModerationDecisionRequest;
import com.prm.channel.dto.response.AdminModerationItemResponse;
import com.prm.channel.service.AdminModerationService;
import com.prm.common.dto.ApiResponse;
import com.prm.common.dto.PageResponse;
import com.prm.common.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Video Moderation", description = "[Admin Only] Quản trị kiểm duyệt video & Thẩm định AI Shield (MarkItDown & RAG Embedding)")
public class AdminModerationController {

    private final AdminModerationService adminModerationService;

    @GetMapping("/reviews")
    @Operation(
            summary = "1. Danh sách hàng đợi kiểm duyệt video (Có phân trang & lọc)",
            description = "Lấy danh sách các video cần kiểm duyệt hoặc lịch sử duyệt, hỗ trợ lọc theo quyết định (PENDING, APPROVED, REJECTED), phân tầng AI Shield (RED_ALERT, FAIR, GOOD, EXCELLENT) và từ khóa tiêu đề/kênh."
    )
    public ResponseEntity<ApiResponse<PageResponse<AdminModerationItemResponse>>> searchReviews(
            @RequestParam(required = false) String decision,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        PageResponse<AdminModerationItemResponse> response = adminModerationService.searchReviews(decision, tier, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/reviews/{id}")
    @Operation(
            summary = "2. Chi tiết kết quả kiểm duyệt AI Shield & Video",
            description = "Truy xuất toàn bộ thông tin chi tiết của một bản ghi duyệt: điểm số AI Shield (0-100), phân tầng (Đỏ/Khá/Tốt/Xuất sắc), lý do vi phạm/nhận xét, báo cáo Markdown từ MarkItDown và thông tin video."
    )
    public ResponseEntity<ApiResponse<AdminModerationItemResponse>> getReviewDetail(@PathVariable Long id) {
        AdminModerationItemResponse response = adminModerationService.getReviewDetail(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/reviews/{id}/decision")
    @Operation(
            summary = "3. Admin ra quyết định Phê Duyệt hoặc Từ Chối",
            description = "Admin xem xét kết quả AI Shield và ra quyết định: APPROVED (công khai video trên hệ thống) hoặc REJECTED (từ chối kèm lý do để Creator chỉnh sửa và làm lại)."
    )
    public ResponseEntity<ApiResponse<AdminModerationItemResponse>> processDecision(
            @PathVariable Long id,
            @Valid @RequestBody AdminModerationDecisionRequest request
    ) {
        String adminEmail = SecurityUtils.getCurrentUserEmail();
        AdminModerationItemResponse response = adminModerationService.processDecision(id, adminEmail, request);
        String msg = "APPROVED".equalsIgnoreCase(request.getDecision())
                ? "Đã phê duyệt video thành công. Video hiện đã được xuất bản công khai!"
                : "Đã từ chối video. Lý do từ chối đã được gửi về cho Creator.";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }
}
