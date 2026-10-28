package com.prm.common.enums;

/**
 * Trạng thái của Artifact (file video/ảnh được upload lên storage).
 */
public enum ArtifactStatus {
    /** Đang xử lý / chờ upload */
    PROCESSING,
    /** Upload và xử lý thành công, sẵn sàng để publish hoặc kiểm duyệt */
    COMPLETED,
    /** Đang trong hàng đợi chờ Admin kiểm duyệt */
    PENDING_REVIEW,
    /** Đã publish cùng Content tương ứng hoặc thay thế phiên bản trước */
    PUBLISHED,
    /** Bị từ chối kiểm duyệt bởi Admin */
    REJECTED,
    /** Bị ẩn */
    HIDDEN,
    /** Phiên bản cũ đã được lưu trữ sau khi bản mới được phê duyệt thay thế */
    ARCHIVED,
    /** Xử lý thất bại */
    FAILED;

    public static ArtifactStatus fromString(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
