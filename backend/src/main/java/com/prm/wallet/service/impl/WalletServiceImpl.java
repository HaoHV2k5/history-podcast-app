package com.prm.wallet.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.payment.dto.request.CreateDepositRequest;
import com.prm.payment.dto.response.PaymentUrlResponse;
import com.prm.payment.service.PaymentService;
import com.prm.wallet.dto.response.WalletResponse;
import com.prm.wallet.dto.response.WalletTransactionResponse;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import com.prm.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;

    @Override
    public WalletResponse getMyWallet() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

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

        return toResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WalletTransactionResponse> getMyTransactions(Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

        Page<WalletTransaction> page = walletTransactionRepository.findByWalletUserId(user.getId(), pageable);
        List<WalletTransactionResponse> items = page.getContent().stream()
                .map(this::toTransactionResponse)
                .toList();

        return PageResponse.of(page, items);
    }

    @Override
    public PaymentUrlResponse createDeposit(CreateDepositRequest request, String ipAddress) {
        return paymentService.createDepositPayment(request, ipAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse findById(Long id) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví với ID: " + id));
        return toResponse(wallet);
    }

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUser() != null ? wallet.getUser().getId() : null)
                .availableBalance(wallet.getAvailableBalance())
                .pendingBalance(wallet.getPendingBalance())
                .currency(wallet.getCurrency())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private WalletTransactionResponse toTransactionResponse(WalletTransaction tx) {
        return WalletTransactionResponse.builder()
                .id(tx.getId())
                .walletId(tx.getWallet() != null ? tx.getWallet().getId() : null)
                .type(tx.getType())
                .amount(tx.getAmount())
                .relatedType(tx.getRelatedType())
                .relatedId(tx.getRelatedId())
                .status(tx.getStatus())
                .merchantTxnRef(tx.getMerchantTxnRef())
                .gatewayTxnNo(tx.getGatewayTxnNo())
                .gatewayProvider(tx.getGatewayProvider())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
