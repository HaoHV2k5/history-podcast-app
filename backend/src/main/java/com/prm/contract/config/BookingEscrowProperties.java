package com.prm.contract.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "booking-escrow")
public class BookingEscrowProperties {

    /**
     * Hạn Người đặt hàng (Viewer/User) phản hồi bảng báo giá Milestone của Creator (giờ). Mặc định: 48h.
     */
    private int contractAcceptHours = 48;

    /**
     * Hạn Người đặt hàng nạp tiền ký quỹ (Escrow) cho một milestone sau khi mở khóa (giờ). Mặc định: 48h.
     */
    private int fundHours = 48;

    /**
     * Thời gian ân hạn chờ nạp tiền ký quỹ cho các Milestone từ mốc #2 trở đi trước khi hủy hợp đồng (ngày). Mặc định: 7 ngày.
     */
    private int fundPauseMaxDays = 7;

    /**
     * Hạn Người đặt hàng nghiệm thu sau khi Creator nộp sản phẩm; quá hạn hệ thống tự động duyệt (ngày). Mặc định: 3 ngày.
     */
    private int reviewDays = 3;

    /**
     * Số ngày giữ tiền an toàn sau khi duyệt trước khi giải ngân về ví Creator (ngày). Mặc định: 3 ngày.
     */
    private int releaseHoldDays = 3;

    /**
     * Số ngày Creator có để chỉnh sửa sản phẩm sau mỗi lần khách yêu cầu sửa (ngày). Mặc định: 2 ngày.
     */
    private int revisionDays = 2;

    /**
     * Số milestone tối đa mỗi hợp đồng (hỗ trợ cả Video lẻ và Series nhiều tập). Mặc định: 20.
     */
    private int maxMilestones = 20;

    /**
     * Số lần yêu cầu chỉnh sửa mặc định mỗi milestone. Mặc định: 2.
     */
    private int maxRevisionsDefault = 2;

    /**
     * Phí dịch vụ nền tảng đối với Hợp đồng đặt làm nội dung (%), khấu trừ khi giải ngân cho Creator. Mặc định: 5.0%.
     */
    private BigDecimal platformFeePercent = new BigDecimal("5.0");

    /**
     * Phí dịch vụ nền tảng đối với Gói Hội Viên Kênh (%), khấu trừ khi Viewer đăng ký hội viên. Mặc định: 10.0% (Creator nhận 90%).
     */
    private BigDecimal membershipFeePercent = new BigDecimal("10.0");

    /**
     * Thời hạn hiệu lực của mỗi lần đăng ký Gói Hội Viên Kênh (ngày). Mặc định: 30 ngày.
     */
    private int membershipDurationDays = 30;

    /**
     * Cam kết thời gian tối đa giải quyết yêu cầu rút tiền về ngân hàng (SLA - ngày). Mặc định: 2 ngày (48h).
     */
    private int withdrawalSlaDays = 2;

    /**
     * Số tiền rút tối thiểu mỗi lần về tài khoản ngân hàng chính chủ (VNĐ). Mặc định: 50.000 VNĐ.
     */
    private BigDecimal withdrawalMinAmount = new BigDecimal("50000");

    /**
     * Số tiền nạp tối thiểu vào ví mỗi lần qua cổng VNPay (VNĐ). Mặc định: 10.000 VNĐ.
     */
    private BigDecimal depositMinAmount = new BigDecimal("10000");

    /**
     * Chu kỳ chạy job quét tự động (phút). Mặc định: 60 phút.
     */
    private int jobIntervalMinutes = 60;

    public static final String DEFAULT_TERMS_TEMPLATE =
            "ĐIỀU KHOẢN TIÊU CHUẨN NỀN TẢNG (PLATFORM ESCROW & SERVICE TERMS)\n\n" +
            "1. Quy trình Đặt hàng Nội dung & Giới hạn 1 Hợp đồng đang mở:\n" +
            "- Khán thính giả (Người đặt hàng) gửi yêu cầu đặt Creator sản xuất Video/Podcast lẻ (SINGLE_VIDEO) hoặc Chuỗi nhiều tập (SERIES).\n" +
            "- Mỗi thời điểm, một Người đặt hàng chỉ được thực hiện tối đa 01 yêu cầu đặt hàng hoặc 01 hợp đồng đang mở. Sau khi Creator bấm Chấp nhận yêu cầu, phòng Chat 1-1 sẽ được mở để hai bên thống nhất kịch bản và lộ trình.\n\n" +
            "2. Báo giá Lộ trình Milestone & Cơ chế Ký quỹ Cuốn chiếu (Escrow Protection):\n" +
            "- Creator lập bảng lộ trình gồm tối đa {maxMilestones} giai đoạn (Milestone) và gửi báo giá; Người đặt hàng có {acceptHours} giờ để xem xét, yêu cầu Creator chỉnh sửa/gộp/xóa mốc hoặc bấm Chấp nhận.\n" +
            "- Người đặt hàng nạp 100% tiền ký quỹ cuốn chiếu cho từng giai đoạn (trong vòng {fundHours} giờ kể từ khi mốc đó mở khóa; các mốc tiếp theo được ân hạn tạm hoãn tối đa {fundPauseMaxDays} ngày).\n" +
            "- Toàn bộ tiền ký quỹ được hệ thống phong tỏa an toàn trong két Escrow cho đến khi giai đoạn hoàn tất.\n\n" +
            "3. Cam kết Tiến độ (dueAt) & Quyền Hủy Hoàn tiền 100% khi Trễ hạn:\n" +
            "- Creator cam kết nộp sản phẩm bàn giao trong thời hạn durationDays của từng Milestone kể từ thời điểm Người đặt hàng nạp tiền ký quỹ.\n" +
            "- Nếu quá hạn dueAt mà Creator vẫn chưa nộp sản phẩm (trạng thái IN_PROGRESS), Người đặt hàng có toàn quyền thỏa thuận chờ thêm qua Chat hoặc bấm Hủy do quá hạn (cancel-overdue) để nhận hoàn lại 100% tiền ký quỹ của giai đoạn đó về ví ngay lập tức.\n\n" +
            "4. Quy trình Kiểm duyệt, Chỉnh sửa & Nghiệm thu Tự động (Review & Auto-Approval):\n" +
            "- Sau khi Creator nộp sản phẩm, Người đặt hàng có thời hạn {reviewDays} để thẩm định chất lượng hoặc yêu cầu chỉnh sửa (tối đa {maxRevisions} trên mỗi giai đoạn, mỗi lần chỉnh sửa Creator có thêm {revisionDays} ngày).\n" +
            "- Nếu quá {reviewDays} mà Người đặt hàng không phản hồi, hệ thống tự động chuyển giai đoạn sang trạng thái ĐÃ DUYỆT (APPROVED) để bảo vệ quyền lợi của Creator.\n\n" +
            "5. Phí Dịch vụ Đặt hàng Nội dung ({feePercent}) & Giải ngân:\n" +
            "- Sau khi giai đoạn được duyệt và qua {releaseHoldDays} giữ an toàn không phát sinh tranh chấp, hệ thống khấu trừ {feePercent} phí dịch vụ nền tảng và giải ngân {creatorNetPercent}% giá trị giai đoạn vào ví khả dụng của Creator.\n\n" +
            "6. Chính sách Gói Hội Viên Kênh (Channel Membership):\n" +
            "- Khán thính giả đăng ký Gói hội viên kênh có thời hạn sử dụng {membershipDurationDays} ngày/lần và được đăng ký hội viên của nhiều kênh khác nhau.\n" +
            "- Doanh thu gói hội viên được phân chia minh bạch: Nền tảng thu {membershipFeePercent}% phí vận hành, Creator nhận ngay {membershipCreatorPercent}% vào ví khả dụng.\n\n" +
            "7. Chính sách Nạp & Rút tiền Ví (Cam kết SLA {withdrawalSlaDays} ngày):\n" +
            "- Hạn mức nạp ví tối thiểu là {depositMinAmount} VNĐ/lần; hạn mức rút tiền về tài khoản ngân hàng chính chủ tối thiểu là {withdrawalMinAmount} VNĐ/lần.\n" +
            "- Hệ thống cam kết thẩm định và giải quyết yêu cầu rút tiền trong tối đa {withdrawalSlaDays} ngày làm việc (48 giờ). Nếu yêu cầu rút tiền bị từ chối hoặc lỗi chuyển khoản liên ngân hàng, 100% số tiền được hoàn trả ngay lập tức về số dư khả dụng của ví.\n\n" +
            "8. Quyền Phân xử Tranh chấp của Ban Quản trị (Dispute Arbitration):\n" +
            "- Khi phát sinh khiếu nại, tiền ký quỹ của giai đoạn liên quan lập tức bị ĐÓNG BĂNG (FROZEN). Ban Quản trị nền tảng đóng vai trò trọng tài độc lập đưa ra phán quyết cuối cùng (Giải ngân cho Creator, Hoàn tiền cho Người đặt hàng, hoặc Phân chia theo tỷ lệ khối lượng thực tế).";

    /**
     * Mẫu văn bản điều khoản hợp đồng tiêu chuẩn có thể tùy biến bởi Admin trên Dashboard.
     */
    private String termsTemplate = DEFAULT_TERMS_TEMPLATE;

    /**
     * Tự động nội suy (interpolate) toàn bộ các con số cấu hình hiện hành vào khung điều khoản.
     */
    public String buildInterpolatedTerms(BigDecimal overrideFeePercent) {
        BigDecimal effFee = overrideFeePercent != null ? overrideFeePercent : (platformFeePercent != null ? platformFeePercent : new BigDecimal("5.0"));
        BigDecimal creatorNetPercent = new BigDecimal("100.0").subtract(effFee);
        BigDecimal memFee = membershipFeePercent != null ? membershipFeePercent : new BigDecimal("10.0");
        BigDecimal memCreatorPercent = new BigDecimal("100.0").subtract(memFee);

        String raw = (termsTemplate != null && !termsTemplate.isBlank()) ? termsTemplate : DEFAULT_TERMS_TEMPLATE;
        return raw
                .replace("{feePercent}%", effFee.toPlainString() + "%")
                .replace("{feePercent}", effFee.toPlainString() + "%")
                .replace("{creatorNetPercent}%", creatorNetPercent.toPlainString() + "%")
                .replace("{creatorNetPercent}", creatorNetPercent.toPlainString() + "%")
                .replace("{acceptHours}", String.valueOf(contractAcceptHours))
                .replace("{fundHours}", String.valueOf(fundHours))
                .replace("{fundPauseMaxDays}", String.valueOf(fundPauseMaxDays))
                .replace("{reviewDays}", reviewDays + " ngày")
                .replace("{releaseHoldDays}", releaseHoldDays + " ngày")
                .replace("{maxRevisions}", maxRevisionsDefault + " lần")
                .replace("{maxRevisionsDefault}", String.valueOf(maxRevisionsDefault))
                .replace("{revisionDays}", String.valueOf(revisionDays))
                .replace("{maxMilestones}", String.valueOf(maxMilestones))
                .replace("{membershipFeePercent}%", memFee.toPlainString() + "%")
                .replace("{membershipFeePercent}", memFee.toPlainString() + "%")
                .replace("{membershipCreatorPercent}%", memCreatorPercent.toPlainString() + "%")
                .replace("{membershipCreatorPercent}", memCreatorPercent.toPlainString() + "%")
                .replace("{membershipDurationDays}", String.valueOf(membershipDurationDays))
                .replace("{withdrawalSlaDays}", String.valueOf(withdrawalSlaDays))
                .replace("{withdrawalMinAmount}", withdrawalMinAmount != null ? withdrawalMinAmount.setScale(0, RoundingMode.HALF_UP).toPlainString() : "50000")
                .replace("{depositMinAmount}", depositMinAmount != null ? depositMinAmount.setScale(0, RoundingMode.HALF_UP).toPlainString() : "10000");
    }
}
