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

    public static final String DEFAULT_TERMS_TEMPLATE =
            "ĐIỀU KHOẢN TIÊU CHUẨN NỀN TẢNG (PLATFORM ESCROW & SERVICE TERMS)\n\n" +
            "1. Cơ chế Ký quỹ & Đảm bảo Thanh toán (Escrow Protection):\n" +
            "- Creator có nghĩa vụ nạp đủ 100% tiền ký quỹ của từng giai đoạn (Milestone) trước khi Freelancer tiến hành công việc.\n" +
            "- Toàn bộ tiền ký quỹ được hệ thống phong tỏa và bảo chứng an toàn, không bên nào được quyền tự ý rút tiền cho đến khi giai đoạn hoàn tất.\n\n" +
            "2. Phí Dịch vụ Nền tảng (Platform Commission):\n" +
            "- Phí dịch vụ nền tảng là {feePercent} tính trên giá trị của từng giai đoạn (do Quản trị viên quy định cố định, không đàm phán).\n" +
            "- Phí sàn được khấu trừ tự động trực tiếp trên từng giai đoạn (Milestone) khi được giải ngân.\n\n" +
            "3. Quy trình Kiểm duyệt & Nghiệm thu tự động (Review & Auto-Approval):\n" +
            "- Sau khi Freelancer nộp bài, Creator có thời hạn {reviewDays} để thẩm định chất lượng sản phẩm.\n" +
            "- Nếu Creator không phản hồi hoặc không yêu cầu chỉnh sửa trong vòng {reviewDays}, hệ thống sẽ tự động chuyển giai đoạn sang trạng thái ĐÃ DUYỆT (APPROVED).\n" +
            "- Tiền ký quỹ được giải ngân về ví Freelancer sau {releaseHoldDays} kể từ thời điểm duyệt.\n\n" +
            "4. Giới hạn Chỉnh sửa & Quyền hạn của Bên thuê (Revision Limits):\n" +
            "- Mỗi giai đoạn có số lần yêu cầu chỉnh sửa tối đa theo thỏa thuận (mặc định {maxRevisions}).\n" +
            "- Khi hết số lần sửa đổi, Creator chỉ có quyền Duyệt nghiệm thu hoặc Khiếu nại (Report) lên Ban quản trị.\n\n" +
            "5. Quyền Phân xử Tranh chấp của Ban Quản trị (Dispute Arbitration):\n" +
            "- Trong trường hợp phát sinh tranh chấp hoặc vi phạm thỏa thuận, một trong hai bên có quyền mở khiếu nại.\n" +
            "- Tiền ký quỹ của giai đoạn liên quan sẽ lập tức bị ĐÓNG BĂNG (FROZEN).\n" +
            "- Ban Quản trị nền tảng đóng vai trò trọng tài độc lập duy nhất có toàn quyền đưa ra phán quyết cuối cùng (Giải ngân cho Freelancer, Hoàn tiền cho Creator, hoặc Phân chia tỷ lệ theo khối lượng công việc thực tế). Các bên cam kết tuân thủ vô điều kiện phán quyết của Ban Quản trị.\n\n" +
            "6. Quyền Sở hữu Trí tuệ (Intellectual Property):\n" +
            "- Sau khi hợp đồng hoàn thành và Freelancer nhận đủ thanh toán, toàn bộ quyền sở hữu trí tuệ và quyền sử dụng thương mại đối với sản phẩm bàn giao (Deliverables) được chuyển giao hoàn toàn và vô điều kiện cho Creator.";

    /**
     * Mẫu văn bản điều khoản hợp đồng tiêu chuẩn có thể tùy biến bởi Admin trên Dashboard.
     */
    private String termsTemplate = DEFAULT_TERMS_TEMPLATE;
}
