package com.prm.payment.service;

import com.prm.payment.dto.request.CreateDepositRequest;
import com.prm.payment.dto.response.PaymentReturnResponse;
import com.prm.payment.dto.response.PaymentUrlResponse;

import java.util.Map;

public interface PaymentService {

    /**
     * Khởi tạo yêu cầu nạp tiền ví qua VNPay Sandbox.
     */
    PaymentUrlResponse createDepositPayment(CreateDepositRequest request, String ipAddress);

    /**
     * Xử lý callback khi người dùng được chuyển hướng về (Return URL) - Read only.
     */
    PaymentReturnResponse handleReturn(Map<String, String> queryParams);

    /**
     * Xử lý IPN Webhook server-to-server từ VNPay (Cập nhật số dư ví atomic).
     * Trả về JSON theo đúng chuẩn VNPay: {"RspCode": "00", "Message": "Confirm Success"}.
     */
    Map<String, String> handleIpn(Map<String, String> ipnParams);
}
