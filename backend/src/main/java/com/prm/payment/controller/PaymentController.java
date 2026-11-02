package com.prm.payment.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.payment.dto.response.PaymentReturnResponse;
import com.prm.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
    @Operation(summary = "1. Xử lý Return URL từ VNPay (UI Display)")
    public ResponseEntity<?> handleReturn(
            @RequestParam Map<String, String> queryParams,
            HttpServletRequest request
    ) {
        PaymentReturnResponse response = paymentService.handleReturn(queryParams);
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("text/html")) {
            boolean ok = "SUCCESS".equalsIgnoreCase(response.getStatus());
            String html = "<!DOCTYPE html><html lang='vi'><head><meta charset='UTF-8'>"
                    + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                    + "<meta http-equiv='refresh' content='2;url=http://localhost:3000/?view=wallet'>"
                    + "<title>Kết quả thanh toán VNPay</title>"
                    + "<style>body{font-family:system-ui,sans-serif;background:#FAF6F0;color:#1C1917;display:flex;align-items:center;justify-content:center;min-height:90vh;margin:0;padding:16px}"
                    + ".card{background:#fff;border:1px solid #E5DDD3;border-radius:14px;padding:28px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.05)}"
                    + ".badge{display:inline-block;padding:6px 14px;border-radius:99px;font-weight:700;font-size:13px;margin-bottom:12px;"
                    + (ok ? "background:#DCFCE7;color:#166534}" : "background:#FEE2E2;color:#991B1B}")
                    + ".btn{display:inline-block;margin-top:18px;padding:11px 22px;background:#991B1B;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px}</style></head>"
                    + "<body><div class='card'>"
                    + "<div class='badge'>" + (ok ? "THANH TOÁN THÀNH CÔNG" : "GIAO DỊCH CHƯA THÀNH CÔNG") + "</div>"
                    + "<h2 style='margin:6px 0 8px'>" + response.getMessage() + "</h2>"
                    + "<p style='color:#6B635B;font-size:14px;margin:4px 0'>Mã đơn: <b>" + response.getMerchantTxnRef() + "</b></p>"
                    + "<p style='color:#6B635B;font-size:13px;margin-top:12px'>Đang tự động quay lại Ví & Quản lý thu nhập...</p>"
                    + "<a class='btn' href='http://localhost:3000/?view=wallet'>Quay lại Ví ngay</a>"
                    + "<script>setTimeout(function(){window.location.replace('http://localhost:3000/?view=wallet');},1500);</script>"
                    + "</div></body></html>";
            return ResponseEntity.ok()
                    .header("Content-Type", "text/html; charset=UTF-8")
                    .body(html);
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/ipn")
    @Operation(summary = "2. Xử lý IPN Webhook từ VNPay (Server-to-Server)")
    public ResponseEntity<Map<String, String>> handleIpn(@RequestParam Map<String, String> ipnParams) {
        log.info("Nhận IPN callback từ VNPay: txnRef={}, amount={}, responseCode={}",
                ipnParams.get("vnp_TxnRef"), ipnParams.get("vnp_Amount"), ipnParams.get("vnp_ResponseCode"));
        Map<String, String> response = paymentService.handleIpn(ipnParams);
        return ResponseEntity.ok(response);
    }
}