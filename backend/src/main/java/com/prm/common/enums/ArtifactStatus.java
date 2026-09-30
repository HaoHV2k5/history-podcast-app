package com.prm.common.enums;

/**
 * Trạng thái của Artifact (file video/ảnh được upload lên storage).
 */
public enum ArtifactStatus {
    /** Đang xử lý / chờ upload */
    PROCESSING,
    /** Upload và xử lý thành công, sẵn sàng để publish */
    COMPLETED,
    /** Đã publish cùng Content tương ứng */
    PUBLISHED,
    /** Bị ẩn */
    HIDDEN,
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
