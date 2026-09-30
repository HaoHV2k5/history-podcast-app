package com.prm.wallet.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import com.prm.wallet.entity.BankAccount;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.entity.Withdrawal;
import com.prm.wallet.repository.BankAccountRepository;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import com.prm.wallet.repository.WithdrawalRepository;
import com.prm.wallet.service.WithdrawalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WithdrawalServiceImpl implements WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final WalletRepository walletRepository;
    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Override
    public WithdrawalResponse requestWithdrawal(WithdrawalRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

        BankAccount bankAccount;
        if (request.getBankAccountId() != null) {
            bankAccount = bankAccountRepository.findByIdAndUserId(request.getBankAccountId(), user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND, "Tài khoản ngân hàng không tồn tại hoặc không thuộc về bạn"));
        } else {
            bankAccount = bankAccountRepository.findByUserIdAndVerifiedTrue(user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND, "Bạn chưa liên kết tài khoản ngân hàng chính chủ đã xác thực"));
        }

        // Khóa ví để kiểm tra số dư và trừ tiền
        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví người dùng"));

        // Kiểm tra xem Creator có đang có lệnh rút tiền PENDING hoặc PROCESSING không
        boolean hasPending = withdrawalRepository.existsByWalletIdAndStatusIn(wallet.getId(), List.of("PENDING", "PROCESSING"));
        if (hasPending) {
            throw new AppException(ErrorCode.PENDING_WITHDRAWAL_EXISTS, "Bạn đang có một yêu cầu rút tiền đang chờ xử lý");
        }

        // Kiểm tra số dư khả dụng
        if (wallet.getAvailableBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_WALLET_BALANCE, "Số dư khả dụng trong ví không đủ để rút tiền");
        }

        // Cập nhật số dư: available -= amount, pending += amount
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(request.getAmount()));
        wallet.setPendingBalance(wallet.getPendingBalance().add(request.getAmount()));
        walletRepository.save(wallet);

        // Lưu bản ghi Withdrawal
        Withdrawal withdrawal = Withdrawal.builder()
                .wallet(wallet)
                .bankAccount(bankAccount)
                .amount(request.getAmount())
                .status("PENDING")
                .requestedAt(Instant.now())
                .build();
        Withdrawal saved = withdrawalRepository.save(withdrawal);

        // Ghi nhận lịch sử giao dịch ví
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type("WITHDRAWAL")
                .amount(request.getAmount())
                .relatedType("WITHDRAWAL")
                .relatedId(saved.getId())
                .status("PENDING")
                .description("Yêu cầu rút tiền về tài khoản ngân hàng " + bankAccount.getBankName())
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        log.info("Tạo yêu cầu rút tiền thành công: userId={}, withdrawalId={}, amount={}",
                user.getId(), saved.getId(), request.getAmount());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WithdrawalResponse> getMyWithdrawals(Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));

        Page<Withdrawal> page = withdrawalRepository.findByWalletUserId(user.getId(), pageable);
        List<WithdrawalResponse> items = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(page, items);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WithdrawalResponse> getAllWithdrawals(Pageable pageable) {
        Page<Withdrawal> page = withdrawalRepository.findAll(pageable);
        List<WithdrawalResponse> items = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(page, items);
    }

    @Override
    public WithdrawalResponse processWithdrawal(Long id) {
        Withdrawal withdrawal = withdrawalRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu rút tiền với ID: " + id));

        if (!"PENDING".equalsIgnoreCase(withdrawal.getStatus())) {
            throw new AppException(ErrorCode.INVALID_WITHDRAWAL_STATE,
                    "Chỉ có thể chuyển sang trạng thái PROCESSING khi yêu cầu đang ở trạng thái PENDING");
        }

        withdrawal.setStatus("PROCESSING");
        Withdrawal updated = withdrawalRepository.save(withdrawal);
        log.info("Admin tiếp nhận xử lý rút tiền: withdrawalId={}", id);
        return toResponse(updated);
    }

    @Override
    public WithdrawalResponse completeWithdrawal(Long id) {
        Withdrawal withdrawal = withdrawalRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu rút tiền với ID: " + id));

        if (!"PROCESSING".equalsIgnoreCase(withdrawal.getStatus())) {
            throw new AppException(ErrorCode.INVALID_WITHDRAWAL_STATE,
                    "Chỉ có thể hoàn tất rút tiền khi yêu cầu đang ở trạng thái PROCESSING");
        }

        // Khóa ví và trừ pending_balance
        Wallet wallet = walletRepository.findByIdForUpdate(withdrawal.getWallet().getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví"));

        wallet.setPendingBalance(wallet.getPendingBalance().subtract(withdrawal.getAmount()));
        walletRepository.save(wallet);

        withdrawal.setStatus("COMPLETED");
        withdrawal.setProcessedAt(Instant.now());
        Withdrawal updated = withdrawalRepository.save(withdrawal);

        log.info("Admin xác nhận chuyển khoản rút tiền thành công: withdrawalId={}, amount={}",
                id, withdrawal.getAmount());
        return toResponse(updated);
    }

    @Override
    public WithdrawalResponse failWithdrawal(Long id, String reason) {
        Withdrawal withdrawal = withdrawalRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu rút tiền với ID: " + id));

        if (!"PROCESSING".equalsIgnoreCase(withdrawal.getStatus())) {
            throw new AppException(ErrorCode.INVALID_WITHDRAWAL_STATE,
                    "Chỉ có thể báo lỗi khi yêu cầu đang ở trạng thái PROCESSING");
        }

        // Khóa ví và hoàn tiền: pending -= amount, available += amount
        Wallet wallet = walletRepository.findByIdForUpdate(withdrawal.getWallet().getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví"));

        wallet.setPendingBalance(wallet.getPendingBalance().subtract(withdrawal.getAmount()));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(withdrawal.getAmount()));
        walletRepository.save(wallet);

        withdrawal.setStatus("FAILED");
        withdrawal.setFailureReason(reason != null ? reason : "Lỗi chuyển khoản ngân hàng thất bại");
        withdrawal.setProcessedAt(Instant.now());
        Withdrawal updated = withdrawalRepository.save(withdrawal);

        log.warn("Chuyển khoản rút tiền thất bại, đã hoàn tiền về ví: withdrawalId={}, reason={}", id, reason);
        return toResponse(updated);
    }

    @Override
    public WithdrawalResponse rejectWithdrawal(Long id, String reason) {
        Withdrawal withdrawal = withdrawalRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu rút tiền với ID: " + id));

        if (!"PENDING".equalsIgnoreCase(withdrawal.getStatus())) {
            throw new AppException(ErrorCode.INVALID_WITHDRAWAL_STATE,
                    "Chỉ có thể từ chối khi yêu cầu đang ở trạng thái PENDING");
        }

        // Khóa ví và hoàn tiền: pending -= amount, available += amount
        Wallet wallet = walletRepository.findByIdForUpdate(withdrawal.getWallet().getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví"));

        wallet.setPendingBalance(wallet.getPendingBalance().subtract(withdrawal.getAmount()));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(withdrawal.getAmount()));
        walletRepository.save(wallet);

        withdrawal.setStatus("REJECTED");
        withdrawal.setFailureReason(reason != null ? reason : "Yêu cầu rút tiền bị từ chối bởi Quản trị viên");
        withdrawal.setProcessedAt(Instant.now());
        Withdrawal updated = withdrawalRepository.save(withdrawal);

        log.info("Admin từ chối yêu cầu rút tiền, đã hoàn tiền về ví: withdrawalId={}, reason={}", id, reason);
        return toResponse(updated);
    }

    private WithdrawalResponse toResponse(Withdrawal w) {
        BankAccount bank = w.getBankAccount();
        return WithdrawalResponse.builder()
                .id(w.getId())
                .walletId(w.getWallet() != null ? w.getWallet().getId() : null)
                .bankAccountId(bank != null ? bank.getId() : null)
                .bankName(bank != null ? bank.getBankName() : null)
                .accountNumber(bank != null ? bank.getAccountNumber() : null)
                .accountHolderName(bank != null ? bank.getAccountHolderName() : null)
                .amount(w.getAmount())
                .status(w.getStatus())
                .requestedAt(w.getRequestedAt())
                .processedAt(w.getProcessedAt())
                .failureReason(w.getFailureReason())
                .build();
    }
}
