package com.prm.contract.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.CommissionStatus;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.response.EscrowPaymentResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.repository.CommissionRepository;
import com.prm.contract.repository.ContractRepository;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.service.EscrowService;
import com.prm.identity.entity.User;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EscrowServiceImpl implements EscrowService {

    private final MilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final BookingEscrowProperties properties;
    private final CommissionRepository commissionRepository;

    @Override
    public EscrowPaymentResponse releaseMilestoneEscrow(Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));

        // Idempotent: nếu đã release rồi thì bỏ qua
        if (milestone.getEscrowStatus() == EscrowStatus.RELEASED) {
            log.warn("Escrow for milestone {} has already been released", milestoneId);
            return toResponse(milestone);
        }

        if (milestone.getEscrowStatus() != EscrowStatus.HELD && milestone.getEscrowStatus() != EscrowStatus.FROZEN) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATE, "Trạng thái khoản ký quỹ không hợp lệ để giải ngân: " + milestone.getEscrowStatus());
        }

        Contract contract = milestone.getContract();
        User creator = contract.getCreator();

        BigDecimal feePercent = contract.getPlatformFeePercent() != null
                ? contract.getPlatformFeePercent()
                : (properties.getPlatformFeePercent() != null ? properties.getPlatformFeePercent() : new BigDecimal("5.0"));

        // 1. Khóa bi quan và cộng 95% (netAmount) vào ví của Creator sản xuất nội dung
        Wallet creatorWallet = getOrCreateWalletForUpdate(creator);
        BigDecimal netAmount = milestone.getNetAmount() != null && milestone.getNetAmount().compareTo(BigDecimal.ZERO) > 0
                ? milestone.getNetAmount()
                : milestone.getAmount().subtract(milestone.getPlatformFee() != null ? milestone.getPlatformFee() : BigDecimal.ZERO);

        creatorWallet.setAvailableBalance(creatorWallet.getAvailableBalance().add(netAmount));
        walletRepository.save(creatorWallet);

        String txDescription = (milestone.getPlatformFee() != null && milestone.getPlatformFee().compareTo(BigDecimal.ZERO) > 0)
                ? "Nhận tiền giải ngân Milestone #" + milestone.getOrderNo() + " (Đã khấu trừ " + feePercent + "% phí nền tảng: " + milestone.getPlatformFee() + " VND)"
                : "Nhận tiền giải ngân Milestone #" + milestone.getOrderNo();

        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(creatorWallet)
                .type("RELEASE")
                .amount(netAmount)
                .relatedType("MILESTONE")
                .relatedId(milestone.getId())
                .status("SUCCESS")
                .description(txDescription)
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(transaction);

        // 2. Cập nhật Escrow fields & Milestone status
        milestone.setEscrowStatus(EscrowStatus.RELEASED);
        milestone.setReleasedAt(Instant.now());
        milestone.setStatus(MilestoneStatus.RELEASED);
        milestoneRepository.save(milestone);

        // 3. Nếu tất cả milestones của hợp đồng đã được RELEASED -> Hợp đồng & HireRequest COMPLETED
        List<Milestone> allMilestones = milestoneRepository.findByContractIdOrderByOrderNoAsc(contract.getId());
        boolean allReleased = allMilestones.stream()
                .allMatch(m -> m.getStatus() == MilestoneStatus.RELEASED);
        if (allReleased) {
            contract.setStatus(ContractStatus.COMPLETED);
            contractRepository.save(contract);
            if (contract.getHireRequest() != null) {
                contract.getHireRequest().setStatus(CommissionStatus.COMPLETED.name());
                commissionRepository.save(contract.getHireRequest());
            }
            log.info("Contract {} marked as COMPLETED after last milestone released", contract.getId());
        }

        log.info("Released escrow for milestone {} to creator {}: net {}", milestoneId, creator.getEmail(), netAmount);
        return toResponse(milestone);
    }

    @Override
    public EscrowPaymentResponse refundMilestoneEscrow(Long milestoneId, String reason) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));

        if (milestone.getEscrowStatus() == EscrowStatus.REFUNDED) {
            log.warn("Escrow for milestone {} has already been refunded", milestoneId);
            return toResponse(milestone);
        }

        if (milestone.getEscrowStatus() != EscrowStatus.HELD && milestone.getEscrowStatus() != EscrowStatus.FROZEN) {
            throw new AppException(ErrorCode.ESCROW_INVALID_STATE, "Trạng thái khoản ký quỹ không thể hoàn tiền: " + milestone.getEscrowStatus());
        }

        Contract contract = milestone.getContract();
        User requester = contract.getFreelancer();

        // 1. Khóa ví Người đặt nội dung (Customer/Requester) và hoàn trả lại 100% tiền đã ký quỹ của milestone này
        Wallet requesterWallet = getOrCreateWalletForUpdate(requester);
        BigDecimal refundAmount = milestone.getAmount();
        requesterWallet.setAvailableBalance(requesterWallet.getAvailableBalance().add(refundAmount));
        walletRepository.save(requesterWallet);

        // 2. Ghi nhận giao dịch hoàn tiền
        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(requesterWallet)
                .type("REFUND")
                .amount(refundAmount)
                .relatedType("MILESTONE")
                .relatedId(milestone.getId())
                .status("SUCCESS")
                .description("Hoàn tiền ký quỹ Milestone #" + milestone.getOrderNo() + ": " + reason)
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(transaction);

        // 3. Cập nhật Escrow fields & Milestone status
        milestone.setEscrowStatus(EscrowStatus.REFUNDED);
        milestone.setRefundedAt(Instant.now());
        milestone.setStatus(MilestoneStatus.CANCELLED);
        milestoneRepository.save(milestone);

        log.info("Refunded escrow for milestone {} to requester {}: amount {}", milestoneId, requester.getEmail(), refundAmount);
        return toResponse(milestone);
    }

    @Override
    public EscrowPaymentResponse splitMilestoneEscrow(Long milestoneId, BigDecimal creatorPercent, String reason) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));

        Contract contract = milestone.getContract();
        User creator = contract.getCreator();
        User requester = contract.getFreelancer();

        BigDecimal totalAmount = milestone.getAmount();
        if (creatorPercent == null || creatorPercent.compareTo(BigDecimal.ZERO) < 0 || creatorPercent.compareTo(new BigDecimal("100")) > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Tỉ lệ phân chia phần trăm phải từ 0% đến 100%");
        }

        BigDecimal feePercent = contract.getPlatformFeePercent() != null
                ? contract.getPlatformFeePercent()
                : (properties.getPlatformFeePercent() != null ? properties.getPlatformFeePercent() : new BigDecimal("5.0"));

        // Creator Gross = totalAmount * (creatorPercent / 100)
        BigDecimal creatorGross = totalAmount.multiply(creatorPercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        // Fee = creatorGross * (feePercent / 100)
        BigDecimal fee = creatorGross.multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal creatorNet = creatorGross.subtract(fee);
        // Requester Refund = totalAmount - creatorGross
        BigDecimal requesterRefund = totalAmount.subtract(creatorGross);

        // Cộng tiền cho Creator sản xuất nội dung nếu > 0
        if (creatorNet.compareTo(BigDecimal.ZERO) > 0) {
            Wallet creatorWallet = getOrCreateWalletForUpdate(creator);
            creatorWallet.setAvailableBalance(creatorWallet.getAvailableBalance().add(creatorNet));
            walletRepository.save(creatorWallet);

            WalletTransaction crTx = WalletTransaction.builder()
                    .wallet(creatorWallet)
                    .type("RELEASE")
                    .amount(creatorNet)
                    .relatedType("MILESTONE")
                    .relatedId(milestone.getId())
                    .status("SUCCESS")
                    .description("Nhận phân xử tranh chấp (" + creatorPercent + "%) cho Milestone #" + milestone.getOrderNo() + " (Đã trừ phí sàn)")
                    .createdAt(Instant.now())
                    .build();
            walletTransactionRepository.save(crTx);
        }

        // Hoàn tiền cho Người đặt nội dung (Customer/Requester) nếu > 0
        if (requesterRefund.compareTo(BigDecimal.ZERO) > 0) {
            Wallet requesterWallet = getOrCreateWalletForUpdate(requester);
            requesterWallet.setAvailableBalance(requesterWallet.getAvailableBalance().add(requesterRefund));
            walletRepository.save(requesterWallet);

            BigDecimal requesterPercent = new BigDecimal("100").subtract(creatorPercent);
            WalletTransaction reqTx = WalletTransaction.builder()
                    .wallet(requesterWallet)
                    .type("REFUND")
                    .amount(requesterRefund)
                    .relatedType("MILESTONE")
                    .relatedId(milestone.getId())
                    .status("SUCCESS")
                    .description("Hoàn tiền phân xử tranh chấp (" + requesterPercent + "%) cho Milestone #" + milestone.getOrderNo())
                    .createdAt(Instant.now())
                    .build();
            walletTransactionRepository.save(reqTx);
        }

        milestone.setEscrowStatus(EscrowStatus.RELEASED);
        milestone.setPlatformFee(fee);
        milestone.setNetAmount(creatorNet);
        milestone.setReleasedAt(Instant.now());
        milestone.setStatus(MilestoneStatus.RELEASED);
        milestoneRepository.save(milestone);

        log.info("Split escrow for milestone {}: creator net={}, requester refund={}, fee={}", milestoneId, creatorNet, requesterRefund, fee);
        return toResponse(milestone);
    }

    @Override
    public EscrowPaymentResponse freezeEscrow(Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));
        milestone.setEscrowStatus(EscrowStatus.FROZEN);
        milestoneRepository.save(milestone);
        log.info("Escrow for milestone {} is FROZEN due to dispute", milestoneId);
        return toResponse(milestone);
    }

    @Override
    @Transactional(readOnly = true)
    public EscrowPaymentResponse getEscrowByMilestoneId(Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));
        return toResponse(milestone);
    }

    private Wallet getOrCreateWalletForUpdate(User user) {
        return walletRepository.findByUserIdForUpdate(user.getId())
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
    }

    private EscrowPaymentResponse toResponse(Milestone entity) {
        return EscrowPaymentResponse.builder()
                .id(entity.getId())
                .milestoneId(entity.getId())
                .amount(entity.getAmount())
                .platformFee(entity.getPlatformFee())
                .netAmount(entity.getNetAmount())
                .status(entity.getEscrowStatus())
                .fundedAt(entity.getFundedAt())
                .releasedAt(entity.getReleasedAt())
                .refundedAt(entity.getRefundedAt())
                .build();
    }
}
