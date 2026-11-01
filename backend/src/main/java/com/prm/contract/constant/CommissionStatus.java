package com.prm.contract.constant;

/**
 * Vòng đời trạng thái của Đơn đặt làm nội dung (Commission)
 */
public enum CommissionStatus {
    /**
     * Người nghe vừa gửi yêu cầu đặt làm nội dung, đang chờ Creator phản hồi (Chưa mở Chat)
     */
    PENDING,

    /**
     * Creator đã chấp nhận thảo luận -> Mở khóa phòng Chat 1-1 để hai bên thương lượng chi tiết
     */
    ACCEPTED,

    /**
     * Creator từ chối yêu cầu (kèm lý do từ chối) -> Giải phóng slot đặt hàng cho Người nghe
     */
    REJECTED,

    /**
     * Creator đã lập và gửi Hợp đồng / Lộ trình Milestone từ yêu cầu này
     */
    CONTRACT_SENT,

    /**
     * Hợp đồng gắn với yêu cầu đã hoàn tất toàn bộ các Milestone
     */
    COMPLETED,

    /**
     * Người nghe chủ động hủy yêu cầu (khi chưa có hợp đồng đang chạy) hoặc bị hủy tự động
     */
    CANCELLED
}
