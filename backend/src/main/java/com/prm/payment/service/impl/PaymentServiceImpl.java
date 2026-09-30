package com.prm.payment.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.payment.dto.request.CreateDepositRequest;
import com.prm.payment.dto.response.PaymentReturnResponse;
import com.prm.payment.dto.response.PaymentUrlResponse;
import com.prm.payment.port.PaymentGatewayPort;
import com.prm.payment.service.PaymentService;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentGatewayPort paymentGatewayPort;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PaymentUrlResponse createDepositPayment(CreateDepositRequest request, String ipAddress) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

        Wallet wallet = walletRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .user(user)
                            .availableBalance(BigDecimal.ZERO)
                            .pendingBalance(BigDecimal.ZERO)
                            .currency("VND")
                            .updatedAt(Instant.now())
                            .build();
                    return walletRepository.save(newWallet);
                });

        // Sinh merchant_txn_ref chuẩn alphanumeric (không có dấu '-')
        String merchantTxnRef = "DEP" + user.getId() + System.currentTimeMillis();

        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type("DEPOSIT")
                .amount(BigDecimal.valueOf(request.getAmount()))
                .status("PENDING")
                .merchantTxnRef(merchantTxnRef)
                .gatewayProvider("VNPAY")
                .description(request.getDescription() != null && !request.getDescription().isBlank()
                        ? request.getDescription()
                        : "Nạp tiền ví nội bộ qua VNPay Sandbox")
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        String paymentUrl = paymentGatewayPort.buildPaymentUrl(
                merchantTxnRef,
                request.getAmount(),
                ipAddress,
                "Nap tien vao vi PRM"
        );

        log.info("Tạo yêu cầu nạp tiền VNPay thành công: userId={}, ref={}, amount={}",
                user.getId(), merchantTxnRef, request.getAmount());

        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .merchantTxnRef(merchantTxnRef)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentReturnResponse handleReturn(Map<String, String> queryParams) {
        boolean isValid = paymentGatewayPort.verifyIpn(queryParams);
        String txnRef = queryParams.get("vnp_TxnRef");
        String transactionNo = queryParams.get("vnp_TransactionNo");
        String responseCode = queryParams.get("vnp_ResponseCode");

        if (!isValid) {
            log.warn("Return URL xác thực chữ ký thất bại: txnRef={}", txnRef);
            return PaymentReturnResponse.builder()
                    .merchantTxnRef(txnRef)
                    .gatewayTxnNo(transactionNo)
                    .amount(BigDecimal.ZERO)
                    .status("FAILED")
                    .message("Chữ ký bảo mật (checksum) không hợp lệ")
                    .build();
        }

        WalletTransaction tx = walletTransactionRepository.findByMerchantTxnRef(txnRef).orElse(null);
        if (tx == null) {
            return PaymentReturnResponse.builder()
                    .merchantTxnRef(txnRef)
                    .gatewayTxnNo(transactionNo)
                    .amount(BigDecimal.ZERO)
                    .status("FAILED")
                    .message("Không tìm thấy thông tin đơn giao dịch")
                    .build();
        }

        String message = "00".equals(responseCode)
                ? "Giao dịch thanh toán thành công"
                : "Giao dịch không thành công hoặc người dùng đã hủy giao dịch";

        return PaymentReturnResponse.builder()
                .merchantTxnRef(tx.getMerchantTxnRef())
                .gatewayTxnNo(tx.getGatewayTxnNo() != null ? tx.getGatewayTxnNo() : transactionNo)
                .amount(tx.getAmount())
                .status(tx.getStatus())
                .message(message)
                .build();
    }

    @Override
    @Transactional
    public Map<String, String> handleIpn(Map<String, String> ipnParams) {
        Map<String, String> response = new HashMap<>();

        // 1. Verify Checksum
        boolean isValidChecksum = paymentGatewayPort.verifyIpn(ipnParams);
        if (!isValidChecksum) {
            log.warn("IPN checksum không hợp lệ");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return response;
        }

        String txnRef = ipnParams.get("vnp_TxnRef");
        String vnpAmountStr = ipnParams.get("vnp_Amount");
        String vnpResponseCode = ipnParams.get("vnp_ResponseCode");
        String vnpTransactionStatus = ipnParams.get("vnp_TransactionStatus");
        String vnpTransactionNo = ipnParams.get("vnp_TransactionNo");

        // 2. Tìm Transaction với PESSIMISTIC_WRITE để khóa dòng
        WalletTransaction tx = walletTransactionRepository.findByMerchantTxnRefForUpdate(txnRef).orElse(null);
        if (tx == null) {
            log.warn("IPN: Không tìm thấy giao dịch có ref={}", txnRef);
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        // 3. Kiểm tra số tiền (vnp_Amount tính bằng xu, nhân 100)
        long vnpAmount = vnpAmountStr != null ? Long.parseLong(vnpAmountStr) : 0;
        long expectedAmount = tx.getAmount().longValue() * 100;
        if (vnpAmount != expectedAmount) {
            log.warn("IPN: Số tiền không khớp ref={}, vnpAmount={}, expected={}", txnRef, vnpAmount, expectedAmount);
            response.put("RspCode", "04");
            response.put("Message", "Invalid Amount");
            return response;
        }

        // 4. Kiểm tra trạng thái giao dịch
        if (!"PENDING".equalsIgnoreCase(tx.getStatus())) {
            log.info("IPN: Giao dịch ref={} đã được xử lý trước đó với status={}", txnRef, tx.getStatus());
            response.put("RspCode", "02");
            response.put("Message", "Order already confirmed");
            return response;
        }

        // 5. Cập nhật số dư ví & trạng thái giao dịch
        if ("00".equals(vnpResponseCode) && "00".equals(vnpTransactionStatus)) {
            Wallet wallet = walletRepository.findByIdForUpdate(tx.getWallet().getId())
                    .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví"));

            wallet.setAvailableBalance(wallet.getAvailableBalance().add(tx.getAmount()));
            walletRepository.save(wallet);

            tx.setStatus("SUCCESS");
            tx.setGatewayTxnNo(vnpTransactionNo);
            walletTransactionRepository.save(tx);

            log.info("IPN: Nạp tiền ví thành công! userId={}, ref={}, +{}",
                    wallet.getUser().getId(), txnRef, tx.getAmount());
        } else {
            tx.setStatus("FAILED");
            tx.setGatewayTxnNo(vnpTransactionNo);
            walletTransactionRepository.save(tx);

            log.warn("IPN: Giao dịch VNPay thất bại: ref={}, code={}, status={}",
                    txnRef, vnpResponseCode, vnpTransactionStatus);
        }

        response.put("RspCode", "00");
        response.put("Message", "Confirm Success");
        return response;
    }
}
