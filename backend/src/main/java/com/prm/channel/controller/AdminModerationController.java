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
import com.prm.channel.dto.request.AiShieldPolicyConfigRequest;
import com.prm.channel.dto.request.BatchUpdatePolicyConfigRequest;
import com.prm.channel.dto.response.AiShieldPolicyConfigResponse;
import com.prm.channel.service.AiShieldPolicyService;
import com.prm.common.enums.AiShieldTier;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Video Moderation", description = "[Admin Only] Quản trị kiểm duyệt video & Thẩm định AI Shield (MarkItDown & RAG Embedding)")
public class AdminModerationController {

    private final AdminModerationService adminModerationService;
    private final AiShieldPolicyService aiShieldPolicyService;

    public AdminModerationController(AdminModerationService adminModerationService) {
        this(adminModerationService, null);
    }

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

    @GetMapping("/policy-configs")
    @Operation(
            summary = "4. Admin xem danh sách cấu hình mức % và trạng thái Enum của AI Shield",
            description = "Truy xuất danh sách toàn bộ các mức phân tầng chính sách (RED_ALERT, FAIR, GOOD, EXCELLENT) kèm ngưỡng %, nhãn tiếng Việt và hành động tương ứng."
    )
    public ResponseEntity<ApiResponse<List<AiShieldPolicyConfigResponse>>> getPolicyConfigs() {
        List<AiShieldPolicyConfigResponse> configs = aiShieldPolicyService.getAllConfigs();
        return ResponseEntity.ok(ApiResponse.success(configs));
    }

    @GetMapping("/policy-configs/{tier}")
    @Operation(
            summary = "5. Admin xem cấu hình chi tiết của một trạng thái Enum AI Shield",
            description = "Truy xuất thông tin cấu hình ngưỡng %, nhãn hiển thị và mô tả cho một trạng thái cụ thể: RED_ALERT, FAIR, GOOD, EXCELLENT."
    )
    public ResponseEntity<ApiResponse<AiShieldPolicyConfigResponse>> getConfigByTier(@PathVariable AiShieldTier tier) {
        AiShieldPolicyConfigResponse config = aiShieldPolicyService.getConfigByTier(tier);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PutMapping("/policy-configs/{tier}")
    @Operation(
            summary = "6. Admin cập nhật mức % và nhãn trạng thái Enum cho AI Shield",
            description = "Cho phép Admin thay đổi ngưỡng % (minScore, maxScore), nhãn hiển thị tiếng Việt, mô tả và trạng thái kích hoạt của một phân tầng."
    )
    public ResponseEntity<ApiResponse<AiShieldPolicyConfigResponse>> updatePolicyConfig(
            @PathVariable AiShieldTier tier,
            @Valid @RequestBody AiShieldPolicyConfigRequest request
    ) {
        AiShieldPolicyConfigResponse updated = aiShieldPolicyService.updateConfig(tier, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật cấu hình chính sách AI Shield cho [" + tier + "] thành công", updated));
    }

    @PutMapping("/policy-configs")
    @Operation(
            summary = "7. Admin cập nhật hàng loạt các mức % chính sách AI Shield",
            description = "Cho phép Admin cập nhật danh sách các mức % và nhãn trạng thái Enum của AI Shield cùng một lúc."
    )
    public ResponseEntity<ApiResponse<List<AiShieldPolicyConfigResponse>>> batchUpdatePolicyConfigs(
            @Valid @RequestBody BatchUpdatePolicyConfigRequest request
    ) {
        List<AiShieldPolicyConfigResponse> updatedList = aiShieldPolicyService.batchUpdateConfigs(request.getConfigs());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật hàng loạt cấu hình chính sách AI Shield thành công", updatedList));
    }

    @PostMapping("/policy-configs/reset-defaults")
    @Operation(
            summary = "8. Admin khôi phục cấu hình chính sách AI Shield về mặc định",
            description = "Khôi phục lại tất cả các mức % (0-50%, 50-80%, 80-90%, >90%) và nhãn hiển thị ban đầu của hệ thống."
    )
    public ResponseEntity<ApiResponse<List<AiShieldPolicyConfigResponse>>> resetDefaultConfigs() {
        List<AiShieldPolicyConfigResponse> resetList = aiShieldPolicyService.resetDefaultConfigs();
        return ResponseEntity.ok(ApiResponse.success("Đã khôi phục cài đặt phân tầng AI Shield về mặc định thành công", resetList));
    }
}
