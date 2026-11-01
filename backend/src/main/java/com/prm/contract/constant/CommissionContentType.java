package com.prm.contract.constant;

/**
 * Loại hình nội dung đặt hàng Creator sản xuất (Commission Content Type).
 * Lưu ý: KHÔNG hỗ trợ đặt làm Livestream theo yêu cầu.
 */
public enum CommissionContentType {
    /**
     * Đặt làm 1 Video / Tập Podcast đơn lẻ theo chủ đề yêu cầu
     */
    SINGLE_VIDEO,

    /**
     * Đặt làm chuỗi nhiều tập (Series) dài kỳ chia theo từng Milestone
     */
    SERIES
}
