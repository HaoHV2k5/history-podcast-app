package com.prm.payment.port;

import java.util.Map;

public interface PaymentGatewayPort {

    /**
     * Sinh URL chuyển hướng sang cổng thanh toán.
     *
     * @param txnRef    Mã giao dịch nội bộ (merchant_txn_ref)
     * @param amount    Số tiền thanh toán (VND)
     * @param ipAddress IP của client yêu cầu
     * @param orderInfo Thông tin mô tả đơn hàng
     * @return URL thanh toán hoàn chỉnh
     */
    String buildPaymentUrl(String txnRef, Long amount, String ipAddress, String orderInfo);

    /**
     * Xác thực chữ ký checksum (vnp_SecureHash) từ callback của cổng thanh toán.
     *
     * @param params Toàn bộ query params nhận được
     * @return true nếu chữ ký hợp lệ, ngược lại false
     */
    boolean verifyIpn(Map<String, String> params);
}
