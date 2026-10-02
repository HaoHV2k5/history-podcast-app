package com.prm.channel.service;

import com.prm.channel.dto.request.AdminModerationDecisionRequest;
import com.prm.channel.dto.response.AdminModerationItemResponse;
import com.prm.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AdminModerationService {

    /**
     * Tìm kiếm và phân trang danh sách video trong hàng đợi kiểm duyệt của Admin.
     * Cho phép lọc theo quyết định (PENDING, APPROVED, REJECTED), phân tầng AI Shield (RED_ALERT, FAIR, GOOD, EXCELLENT) và từ khóa.
     */
    PageResponse<AdminModerationItemResponse> searchReviews(
            String decision,
            String tier,
            String search,
            Pageable pageable
    );

    /**
     * Lấy chi tiết một phiên kiểm duyệt video bao gồm phân tích của AI Shield, báo cáo Markdown từ MarkItDown, video url và kịch bản.
     */
    AdminModerationItemResponse getReviewDetail(Long reviewId);

    /**
     * Admin đưa ra quyết định:
     * - APPROVED (Chấp nhận): Video chuyển sang trạng thái PUBLISHED để người dùng xem công khai.
     * - REJECTED (Từ chối): Video chuyển sang trạng thái REJECTED kèm lý do để Creator chỉnh sửa và làm lại.
     */
    AdminModerationItemResponse processDecision(
            Long reviewId,
            String adminEmail,
            AdminModerationDecisionRequest request
    );
}
