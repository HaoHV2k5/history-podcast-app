package com.prm.membership.service;

import com.prm.common.dto.PageResponse;
import com.prm.membership.dto.request.MembershipPlanRequest;
import com.prm.membership.dto.response.*;
import org.springframework.data.domain.Pageable;

public interface MembershipService {

    /**
     * Creator thiết lập hoặc cập nhật gói hội viên của kênh (Upsert có kiểm tra Anti-IDOR).
     */
    MembershipPlanResponse upsertChannelPlan(Long channelId, MembershipPlanRequest request);

    /**
     * Xem thông tin gói hội viên công khai của kênh.
     */
    MembershipPlanResponse getChannelPlan(Long channelId);

    /**
     * Viewer thanh toán mua gói hội viên kênh bằng số dư ví.
     */
    MembershipSubscribeResponse subscribe(Long channelId);

    /**
     * Kiểm tra người dùng hiện tại có quyền xem nội dung độc quyền của kênh hay không.
     */
    MembershipCheckResponse checkMembership(Long channelId);

    /**
     * Viewer xem danh sách các kênh mình đang tham gia hội viên còn hạn (phân trang).
     */
    PageResponse<MyMembershipResponse> getMyMemberships(Pageable pageable);
}
