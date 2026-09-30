package com.prm.common.enums;

/**
 * Trạng thái của Content (video/bài đăng do creator tạo ra).
 */
public enum ContentStatus {
    /** Mới tạo hoặc đang render, chưa publish */
    DRAFT,
    /** Render xong nhưng chưa được creator publish */
    COMPLETED,
    /** Đã publish — hiển thị công khai, dùng optimizedUrl cho CDN */
    PUBLISHED,
    /** Creator ẩn video khỏi public */
    HIDDEN,
    /** Quá trình render/xử lý thất bại */
    FAILED;

    /** Kiểm tra xem status này có được tính là "đã publish" không */
    public boolean isPublished() {
        return this == PUBLISHED;
    }

    /** Parse case-insensitive từ String, trả null nếu không hợp lệ */
    public static ContentStatus fromString(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
