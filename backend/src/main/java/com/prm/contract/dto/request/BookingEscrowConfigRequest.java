package com.prm.contract.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEscrowConfigRequest {

    @Min(value = 1, message = "Thời hạn Freelancer phản hồi hợp đồng tối thiểu 1 giờ")
    @Max(value = 720, message = "Thời hạn Freelancer phản hồi hợp đồng tối đa 720 giờ (30 ngày)")
    private Integer contractAcceptHours;

    @Min(value = 1, message = "Thời hạn ký quỹ milestone tối thiểu 1 giờ")
    @Max(value = 720, message = "Thời hạn ký quỹ milestone tối đa 720 giờ (30 ngày)")
    private Integer fundHours;

    @Min(value = 1, message = "Thời gian tạm dừng tối đa trước khi hủy hợp đồng tối thiểu 1 ngày")
    @Max(value = 90, message = "Thời gian tạm dừng tối đa trước khi hủy hợp đồng tối đa 90 ngày")
    private Integer fundPauseMaxDays;

    @Min(value = 1, message = "Thời hạn duyệt sản phẩm tối thiểu 1 ngày")
    @Max(value = 30, message = "Thời hạn duyệt sản phẩm tối đa 30 ngày")
    private Integer reviewDays;

    @Min(value = 0, message = "Thời gian giữ tiền trước giải ngân tối thiểu 0 ngày")
    @Max(value = 30, message = "Thời gian giữ tiền trước giải ngân tối đa 30 ngày")
    private Integer releaseHoldDays;

    @Min(value = 1, message = "Thời hạn sửa sản phẩm tối thiểu 1 ngày")
    @Max(value = 30, message = "Thời hạn sửa sản phẩm tối đa 30 ngày")
    private Integer revisionDays;

    @Min(value = 1, message = "Số milestone tối đa mỗi hợp đồng tối thiểu 1")
    @Max(value = 20, message = "Số milestone tối đa mỗi hợp đồng tối đa 20")
    private Integer maxMilestones;

    @Min(value = 0, message = "Số lượt yêu cầu chỉnh sửa mặc định tối thiểu 0")
    @Max(value = 10, message = "Số lượt yêu cầu chỉnh sửa mặc định tối đa 10")
    private Integer maxRevisionsDefault;

    @DecimalMin(value = "0.0", message = "Phí nền tảng tối thiểu 0.0%")
    @DecimalMax(value = "50.0", message = "Phí nền tảng tối đa 50.0%")
    private BigDecimal platformFeePercent;

    @Min(value = 5, message = "Chu kỳ chạy job quét tối thiểu 5 phút")
    @Max(value = 1440, message = "Chu kỳ chạy job quét tối đa 1440 phút (24h)")
    private Integer jobIntervalMinutes;
}
