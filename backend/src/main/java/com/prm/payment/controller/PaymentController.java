package com.prm.payment.controller;

import com.prm.common.dto.ApiResponse;
import com.prm.payment.dto.response.PaymentReturnResponse;
import com.prm.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
