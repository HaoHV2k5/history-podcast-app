package com.prm.contract.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "booking-escrow")
public class BookingEscrowProperties {

    /**
     * Hạn freelancer accept/reject hợp đồng (giờ). Mặc định: 48h.
     */
    private int contractAcceptHours = 48;

    /**
     * Hạn creator ký quỹ cho một milestone (giờ). Mặc định: 48h.
     */
    private int fundHours = 48;

    /**
     * Quá hạn ký quỹ M2+ bao lâu thì hủy hợp đồng (ngày). Mặc định: 7 ngày.
     */
    private int fundPauseMaxDays = 7;

    /**
     * Hạn creator duyệt sau khi freelancer nộp; quá hạn thì tự duyệt (ngày). Mặc định: 3 ngày.
     */
    private int reviewDays = 3;

    /**
     * Số ngày giữ tiền sau khi duyệt trước khi release (ngày). Mặc định: 3 ngày.
     */
    private int releaseHoldDays = 3;

    /**
     * Số ngày freelancer có để sửa sau mỗi lần yêu cầu sửa (ngày). Mặc định: 2 ngày.
     */
    private int revisionDays = 2;

    /**
     * Số milestone tối đa mỗi hợp đồng. Mặc định: 5.
     */
    private int maxMilestones = 5;

    /**
     * Số lần sửa mặc định mỗi milestone. Mặc định: 2.
     */
    private int maxRevisionsDefault = 2;

    /**
     * Phí nền tảng (%), trừ vào số tiền freelancer nhận khi release. Mặc định: 5.0%.
     */
    private BigDecimal platformFeePercent = new BigDecimal("5.0");

    /**
     * Chu kỳ chạy job quét (phút). Mặc định: 60 phút.
     */
    private int jobIntervalMinutes = 60;
}
