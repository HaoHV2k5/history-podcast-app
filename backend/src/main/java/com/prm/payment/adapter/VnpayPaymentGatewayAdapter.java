package com.prm.payment.adapter;

import com.prm.payment.config.VnpayProperties;
import com.prm.payment.port.PaymentGatewayPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class VnpayPaymentGatewayAdapter implements PaymentGatewayPort {

    private final VnpayProperties properties;

    private static final DateTimeFormatter VNP_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Override
    public String buildPaymentUrl(String txnRef, Long amount, String ipAddress, String orderInfo) {
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", properties.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100)); // VNPay tính bằng đơn vị xu (nhân 100)
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo != null && !orderInfo.isBlank() ? orderInfo : "Nap tien vao vi PRM");
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", properties.getReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress != null && !ipAddress.isBlank() ? ipAddress : "127.0.0.1");

        Instant now = Instant.now();
        vnpParams.put("vnp_CreateDate", VNP_DATE_FORMATTER.format(now));
        vnpParams.put("vnp_ExpireDate", VNP_DATE_FORMATTER.format(now.plusSeconds(900))); // Hết hạn sau 15 phút

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        try {
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnpParams.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                            .append('=')
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
            String vnpSecureHash = hmacSHA512(properties.getHashSecret(), hashData.toString());
            query.append("&vnp_SecureHash=").append(vnpSecureHash);

            return properties.getPayUrl() + "?" + query.toString();
        } catch (Exception e) {
            log.error("Lỗi khi sinh URL thanh toán VNPay: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo URL thanh toán VNPay", e);
        }
    }

    @Override
    public boolean verifyIpn(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.isBlank()) {
            return false;
        }

        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        try {
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }
            String sign = hmacSHA512(properties.getHashSecret(), hashData.toString());
            return sign.equalsIgnoreCase(vnpSecureHash);
        } catch (Exception e) {
            log.error("Lỗi khi verify checksum VNPay: {}", e.getMessage(), e);
            return false;
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmacSha512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmacSha512.init(secretKey);
            byte[] hash = hmacSha512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            log.error("Lỗi thuật toán HmacSHA512: {}", ex.getMessage(), ex);
            throw new RuntimeException("Lỗi thuật toán mã hóa HMAC-SHA512", ex);
        }
    }
}
