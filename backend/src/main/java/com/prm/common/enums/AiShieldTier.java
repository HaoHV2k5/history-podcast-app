package com.prm.common.enums;

import lombok.Getter;

import java.math.BigDecimal;

/**
 * Trạng thái phân tầng kiểm duyệt của AI Shield dựa trên điểm số đánh giá tính xác thực sử liệu.
 */
@Getter
public enum AiShieldTier {
    /** Điểm dưới 50%: Báo động đỏ, sai lệch hoặc vi phạm nghiêm trọng */
    RED_ALERT("Báo động đỏ", new BigDecimal("0.00"), new BigDecimal("50.00"), "Điểm dưới 50% - Báo động đỏ, nội dung vi phạm hoặc sai lệch sử liệu nghiêm trọng"),

    /** Điểm từ 50% đến dưới 80%: Khá, nội dung tương đối ổn nhưng cần rà soát thêm */
    FAIR("Khá", new BigDecimal("50.00"), new BigDecimal("80.00"), "Điểm từ 50% đến dưới 80% - Khá, cần rà soát và hoàn thiện thêm"),

    /** Điểm từ 80% đến 90%: Tốt, đạt chuẩn xuất bản */
    GOOD("Tốt", new BigDecimal("80.00"), new BigDecimal("90.00"), "Điểm từ 80% đến 90% - Tốt, đạt chuẩn xuất bản"),

    /** Điểm trên 90%: Xuất sắc, độ tin cậy và chất lượng cao */
    EXCELLENT("Xuất sắc", new BigDecimal("90.00"), new BigDecimal("100.00"), "Điểm trên 90% - Xuất sắc, chất lượng tư liệu rất cao");

    private final String defaultLabel;
    private final BigDecimal defaultMinScore;
    private final BigDecimal defaultMaxScore;
    private final String defaultDescription;

    AiShieldTier(String defaultLabel, BigDecimal defaultMinScore, BigDecimal defaultMaxScore, String defaultDescription) {
        this.defaultLabel = defaultLabel;
        this.defaultMinScore = defaultMinScore;
        this.defaultMaxScore = defaultMaxScore;
        this.defaultDescription = defaultDescription;
    }

    /**
     * Parse case-insensitive từ String name, hỗ trợ fallback theo từ khóa phổ biến.
     */
    public static AiShieldTier fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String clean = value.trim().toUpperCase();
        for (AiShieldTier tier : values()) {
            if (tier.name().equals(clean)) {
                return tier;
            }
        }
        if (clean.contains("RED") || clean.contains("ALERT") || clean.contains("CRITICAL")) {
            return RED_ALERT;
        } else if (clean.contains("FAIR") || clean.contains("WARNING") || clean.contains("KHÁ")) {
            return FAIR;
        } else if (clean.contains("GOOD") || clean.contains("TỐT")) {
            return GOOD;
        } else if (clean.contains("EXCELLENT") || clean.contains("XUẤT SẮC")) {
            return EXCELLENT;
        }
        return null;
    }
}
