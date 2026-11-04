package com.prm.payment.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.payment.dto.response.PaymentReturnResponse;
import com.prm.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments/vnpay")
@RequiredArgsConstructor
@Tag(name = "Payment Gateway Callbacks", description = "Endpoints xử lý kết quả callback và webhook từ VNPay Sandbox")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/return")
    @Operation(summary = "1. Xử lý Return URL từ VNPay (UI Display)",
            description = "VNPay chuyển hướng trình duyệt của người dùng về đây sau khi thanh toán. Chỉ xác thực checksum và đọc trạng thái hiển thị, tuyệt đối không cộng tiền tại đây.")
    public ResponseEntity<ApiResponse<PaymentReturnResponse>> handleReturn(@RequestParam Map<String, String> queryParams) {
        PaymentReturnResponse response = paymentService.handleReturn(queryParams);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(value = "/mobile-return", produces = MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
    @Operation(summary = "1b. Xử lý Return URL từ VNPay dành cho Mobile App (Deep Link Redirect)",
            description = "Xác thực chữ ký VNPay, đối soát cộng tiền vào ví ngay lập tức và tự động điều hướng trình duyệt trên điện thoại quay thẳng về ứng dụng Sử Ký qua Deep Link suky://vnpay-return.")
    public ResponseEntity<String> handleMobileReturn(@RequestParam Map<String, String> queryParams) {
        String txnRef = queryParams.getOrDefault("vnp_TxnRef", "");
        String responseCode = queryParams.getOrDefault("vnp_ResponseCode", "");
        try {
            paymentService.handleIpn(queryParams);
        } catch (Exception e) {
            log.warn("Lỗi khi tự động đối soát IPN tại mobile-return (txnRef={}): {}", txnRef, e.getMessage());
        }

        PaymentReturnResponse result = paymentService.handleReturn(queryParams);
        boolean isSuccess = "00".equals(responseCode) && !"FAILED".equalsIgnoreCase(result.getStatus());
        String statusParam = isSuccess ? "success" : "failed";
        String deepLink = "suky://vnpay-return?status=" + statusParam + "&txnRef=" + txnRef + "&code=" + responseCode;
        String intentLink = "intent://vnpay-return?status=" + statusParam + "&txnRef=" + txnRef
                + "#Intent;scheme=suky;package=com.example.su_ky_mobile;end";

        String title = isSuccess ? "Thanh toán thành công!" : "Giao dịch chưa hoàn tất";
        String subtitle = isSuccess
                ? "Số dư Ví Sử Ký của bạn đã được cập nhật. Đang tự động quay về ứng dụng Sử Ký..."
                : (result.getMessage() != null ? result.getMessage() : "Giao dịch đã bị hủy hoặc không thành công.");
        String badgeColor = isSuccess ? "#2E7D32" : "#B91C1C";

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%s - Sử Ký</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 24px;
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      background: #FAF6F0;
                      color: #1F1A17;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 85vh;
                    }
                    .card {
                      max-width: 400px;
                      width: 100%%;
                      background: #FFFFFF;
                      border: 1px solid #E6DEC8;
                      border-radius: 16px;
                      padding: 28px 22px;
                      text-align: center;
                      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
                    }
                    .badge {
                      display: inline-block;
                      padding: 6px 14px;
                      border-radius: 999px;
                      font-size: 12px;
                      font-weight: 700;
                      color: #FFFFFF;
                      background: %s;
                      margin-bottom: 14px;
                    }
                    h1 {
                      font-size: 20px;
                      margin: 0 0 10px;
                    }
                    p {
                      font-size: 14px;
                      color: #5C5346;
                      line-height: 1.5;
                      margin: 0 0 22px;
                    }
                    .btn {
                      display: block;
                      width: 100%%;
                      box-sizing: border-box;
                      padding: 14px 18px;
                      background: #991B1B;
                      color: #FFFFFF;
                      text-decoration: none;
                      font-weight: 700;
                      font-size: 15px;
                      border-radius: 10px;
                    }
                    .ref {
                      margin-top: 14px;
                      font-size: 12px;
                      color: #8C8273;
                    }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="badge">%s</div>
                    <h1>%s</h1>
                    <p>%s</p>
                    <a id="return-btn" class="btn" href="%s">Quay về ứng dụng Sử Ký ngay</a>
                    <div class="ref">Mã giao dịch: %s</div>
                  </div>
                  <script>
                    (function() {
                      var deepLink = "%s";
                      var intentLink = "%s";
                      setTimeout(function() {
                        window.location.replace(deepLink);
                      }, 150);
                      setTimeout(function() {
                        window.location.replace(intentLink);
                      }, 650);
                    })();
                  </script>
                </body>
                </html>
                """.formatted(
                title,
                badgeColor,
                isSuccess ? "VNPAY SANDBOX · ĐÃ XÁC NHẬN" : "VNPAY SANDBOX",
                title,
                subtitle,
                deepLink,
                txnRef,
                deepLink,
                intentLink
        );

        return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(html);
    }

    @GetMapping("/ipn")
    @Operation(summary = "2. Xử lý IPN Webhook từ VNPay (Server-to-Server)",
            description = "VNPay gọi ngầm để thông báo kết quả giao dịch. Nơi duy nhất xác thực checksum, kiểm tra số tiền và cộng tiền vào ví một cách atomic. Bắt buộc trả về JSON phẳng chuẩn VNPay.")
    public ResponseEntity<Map<String, String>> handleIpn(@RequestParam Map<String, String> ipnParams) {
        log.info("Nhận IPN callback từ VNPay: txnRef={}, amount={}, responseCode={}",
                ipnParams.get("vnp_TxnRef"), ipnParams.get("vnp_Amount"), ipnParams.get("vnp_ResponseCode"));
        Map<String, String> response = paymentService.handleIpn(ipnParams);
        return ResponseEntity.ok(response);
    }
}
