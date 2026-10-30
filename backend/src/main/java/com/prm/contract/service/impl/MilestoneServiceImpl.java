package com.prm.contract.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.CommissionStatus;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.request.MilestoneItemRequest;
import com.prm.contract.dto.request.RequestRevisionRequest;
import com.prm.contract.dto.request.SubmitDeliverableRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.dto.response.MilestoneDeliverableResponse;
import com.prm.contract.dto.response.MilestoneResponse;
import com.prm.contract.dto.response.MilestoneReviewResponse;
import com.prm.contract.dto.response.RevisionRequestResponse;
import com.prm.contract.dto.response.SubmissionResponse;
import com.prm.contract.entity.*;
import com.prm.contract.repository.*;
import com.prm.contract.service.EscrowService;
import com.prm.contract.service.MilestoneService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MilestoneServiceImpl implements MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final SubmissionRepository submissionRepository;
    private final RevisionRequestRepository revisionRequestRepository;
    private final MilestoneDeliverableRepository deliverableRepository;
    private final MilestoneReviewRepository milestoneReviewRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final EscrowService escrowService;
    private final BookingEscrowProperties properties;
    private final CommissionRepository commissionRepository;

    @Override
    public MilestoneResponse updateMilestone(Long milestoneId, MilestoneItemRequest request) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator lập hợp đồng mới có quyền chỉnh sửa milestone");
        }

        validateEditableContract(contract);

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_CONTRACT_DATA, "Số tiền milestone phải lớn hơn 0");
        }
        if (request.getDurationDays() == null || request.getDurationDays() <= 0) {
            throw new AppException(ErrorCode.INVALID_CONTRACT_DATA, "Thời gian thực hiện milestone tối thiểu 1 ngày");
        }

        milestone.setTitle(request.getTitle().trim());
        milestone.setRequirement(request.getRequirement().trim());
        milestone.setAmount(request.getAmount());
        milestone.setDurationDays(request.getDurationDays());
        if (request.getMaxRevisions() != null) {
            milestone.setMaxRevisions(request.getMaxRevisions());
        }
        if (request.getRevisionDays() != null && request.getRevisionDays() > 0) {
            milestone.setRevisionDays(request.getRevisionDays());
        }
        milestone.setStatus(MilestoneStatus.WAITING);
        milestone.setFundDueAt(null);
        milestoneRepository.save(milestone);

        List<Milestone> allMilestones = milestoneRepository.findByContractIdOrderByOrderNoAsc(contract.getId());
        recalculateContractAndMilestones(contract, allMilestones);

        Milestone updated = milestoneRepository.findById(milestoneId).orElse(milestone);
        log.info("Creator {} updated milestone {} of contract {}", currentUser.getEmail(), milestoneId, contract.getId());
        return toMilestoneResponse(updated);
    }

    @Override
    public ContractResponse deleteMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator lập hợp đồng mới có quyền xóa milestone");
        }

        validateEditableContract(contract);

        List<Milestone> allMilestones = milestoneRepository.findByContractIdOrderByOrderNoAsc(contract.getId());
        if (allMilestones.size() <= 1) {
            throw new AppException(ErrorCode.MILESTONE_MINIMUM_REQUIRED,
                    "Hợp đồng phải có tối thiểu 1 milestone, không thể xóa milestone cuối cùng");
        }

        if (contract.getMilestones() != null) {
            contract.getMilestones().removeIf(m -> milestoneId.equals(m.getId()));
        }
        milestoneRepository.delete(milestone);
        milestoneRepository.flush();

        List<Milestone> remainingMilestones = allMilestones.stream()
                .filter(m -> !m.getId().equals(milestoneId))
                .toList();

        recalculateContractAndMilestones(contract, remainingMilestones);

        log.info("Creator {} deleted milestone {} from contract {}, remaining milestones: {}",
                currentUser.getEmail(), milestoneId, contract.getId(), remainingMilestones.size());

        return toContractResponse(contract, remainingMilestones);
    }

    @Override
    public MilestoneResponse fundMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getFreelancer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Người đặt nội dung của hợp đồng mới có quyền nạp tiền ký quỹ milestone");
        }

        if (milestone.getStatus() != MilestoneStatus.UNFUNDED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái chờ ký quỹ (UNFUNDED): " + milestone.getStatus());
        }

        BigDecimal amount = milestone.getAmount();

        // 1. Kiểm tra số dư ví và khóa ví Người đặt nội dung (Customer/Requester)
        Wallet requesterWallet = walletRepository.findByUserIdForUpdate(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví của bạn"));

        if (requesterWallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_WALLET_BALANCE,
                    "Số dư ví khả dụng không đủ để ký quỹ milestone (Cần " + amount + " VND, hiện có " + requesterWallet.getAvailableBalance() + " VND)");
        }

        // 2. Trừ tiền ví Người đặt nội dung
        requesterWallet.setAvailableBalance(requesterWallet.getAvailableBalance().subtract(amount));
        walletRepository.save(requesterWallet);

        // 3. Ghi nhận giao dịch trừ tiền
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(requesterWallet)
                .type("FUND_ESCROW")
                .amount(amount.negate())
                .relatedType("MILESTONE")
                .relatedId(milestone.getId())
                .status("SUCCESS")
                .description("Ký quỹ Milestone #" + milestone.getOrderNo() + ": " + milestone.getTitle())
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        // 4. Đảm bảo platformFee & netAmount đã được tính theo tỷ lệ snapshot của hợp đồng
        if (milestone.getPlatformFee() == null || milestone.getNetAmount() == null) {
            BigDecimal feePercent = contract.getPlatformFeePercent() != null
                    ? contract.getPlatformFeePercent()
                    : (properties.getPlatformFeePercent() != null ? properties.getPlatformFeePercent() : new BigDecimal("5.0"));
            BigDecimal fee = amount.multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            milestone.setPlatformFee(fee);
            milestone.setNetAmount(amount.subtract(fee));
        }

        milestone.setEscrowStatus(EscrowStatus.HELD);
        milestone.setFundedAt(Instant.now());

        // 5. Chuyển trạng thái Milestone sang IN_PROGRESS và bắt đầu tính deadline
        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        milestone.setDueAt(Instant.now().plus(milestone.getDurationDays(), ChronoUnit.DAYS));
        Milestone saved = milestoneRepository.save(milestone);

        log.info("Milestone {} funded successfully by requester {}, due at {}", milestoneId, currentUser.getEmail(), saved.getDueAt());
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse submitDeliverable(Long milestoneId, SubmitDeliverableRequest request) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator nhận làm nội dung mới có quyền nộp sản phẩm bàn giao");
        }

        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái đang thực hiện (IN_PROGRESS)");
        }

        boolean hasContent = request != null && request.getContent() != null && !request.getContent().isBlank();
        boolean hasFileUrl = request != null && request.getFileUrl() != null && !request.getFileUrl().isBlank();
        if (!hasContent && !hasFileUrl) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng nhập nội dung bàn giao hoặc đính kèm đường dẫn file sản phẩm");
        }

        // Tính version nộp bài
        List<Submission> existing = submissionRepository.findByMilestoneIdOrderByVersionNoDesc(milestoneId);
        int nextVersion = existing.isEmpty() ? 1 : existing.get(0).getVersionNo() + 1;

        Submission submission = Submission.builder()
                .milestone(milestone)
                .versionNo(nextVersion)
                .content(request.getContent())
                .fileUrl(request.getFileUrl())
                .createdAt(Instant.now())
                .build();
        submissionRepository.save(submission);

        // Chuyển sang SUBMITTED và hẹn giờ tự duyệt sau REVIEW_DAYS
        milestone.setStatus(MilestoneStatus.SUBMITTED);
        milestone.setReviewDueAt(Instant.now().plus(properties.getReviewDays(), ChronoUnit.DAYS));
        Milestone saved = milestoneRepository.save(milestone);

        log.info("Creator {} submitted work for milestone {} (version {})", currentUser.getEmail(), milestoneId, nextVersion);
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse requestRevision(Long milestoneId, RequestRevisionRequest request) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getFreelancer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Người đặt nội dung mới có quyền yêu cầu chỉnh sửa sản phẩm");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone chưa được nộp bài để yêu cầu chỉnh sửa");
        }

        if (milestone.getRevisionsUsed() >= milestone.getMaxRevisions()) {
            throw new AppException(ErrorCode.MAX_REVISIONS_REACHED,
                    "Đã sử dụng hết số lần sửa (" + milestone.getMaxRevisions() + " lần). Bạn chỉ có thể Duyệt hoặc Khiếu nại (Report).");
        }

        Submission targetSubmission = null;
        if (request.getSubmissionId() != null) {
            targetSubmission = submissionRepository.findById(request.getSubmissionId()).orElse(null);
        } else {
            targetSubmission = submissionRepository.findTopByMilestoneIdOrderByVersionNoDesc(milestoneId).orElse(null);
        }

        RevisionRequest rev = RevisionRequest.builder()
                .milestone(milestone)
                .submission(targetSubmission)
                .note(request.getNote())
                .createdAt(Instant.now())
                .build();
        revisionRequestRepository.save(rev);

        milestone.setRevisionsUsed(milestone.getRevisionsUsed() + 1);
        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        int revDays = (milestone.getRevisionDays() != null && milestone.getRevisionDays() > 0)
                ? milestone.getRevisionDays()
                : properties.getRevisionDays();
        milestone.setDueAt(Instant.now().plus(revDays, ChronoUnit.DAYS));
        milestone.setReviewDueAt(null);
        Milestone saved = milestoneRepository.save(milestone);

        log.info("Requester {} requested revision for milestone {}, revision count: {}",
                currentUser.getEmail(), milestoneId, saved.getRevisionsUsed());
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse approveMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getFreelancer().getId().equals(currentUser.getId()) && !currentUser.hasRole("ADMIN")) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Người đặt nội dung mới có quyền duyệt nghiệm thu milestone");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái SUBMITTED để duyệt");
        }

        // 1. Chuyển sang APPROVED, set releaseAt = now + RELEASE_HOLD_DAYS
        int holdDays = properties.getReleaseHoldDays();
        milestone.setStatus(MilestoneStatus.APPROVED);
        milestone.setReleaseAt(Instant.now().plus(Math.max(0, holdDays), ChronoUnit.DAYS));
        Milestone saved = milestoneRepository.save(milestone);

        // 2. Kích hoạt ngay Milestone kế tiếp chuyển từ WAITING sang UNFUNDED nếu có
        Optional<Milestone> nextMilestoneOpt = milestoneRepository.findByContractIdAndOrderNo(contract.getId(), milestone.getOrderNo() + 1);
        if (nextMilestoneOpt.isPresent()) {
            Milestone nextMilestone = nextMilestoneOpt.get();
            if (nextMilestone.getStatus() == MilestoneStatus.WAITING) {
                nextMilestone.setStatus(MilestoneStatus.UNFUNDED);
                nextMilestone.setFundDueAt(Instant.now().plus(properties.getFundHours(), ChronoUnit.HOURS));
                milestoneRepository.save(nextMilestone);
                log.info("Next milestone {} transitioned to UNFUNDED, fund due at {}", nextMilestone.getId(), nextMilestone.getFundDueAt());
            }
        }

        // 3. Nếu cấu hình releaseHoldDays <= 0, giải ngân ngay 95% cho Creator (và hoàn tất Contract + HireRequest nếu là mốc cuối)
        if (holdDays <= 0) {
            escrowService.releaseMilestoneEscrow(saved.getId());
            saved = milestoneRepository.findById(saved.getId()).orElse(saved);
        }

        log.info("Milestone {} APPROVED by {}, release scheduled at {}", milestoneId, currentUser.getEmail(), saved.getReleaseAt());
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse cancelOverdueMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getFreelancer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Người đặt nội dung mới có quyền hủy milestone quá hạn");
        }

        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Chỉ milestone IN_PROGRESS mới có thể bị hủy vì trễ hạn");
        }

        if (milestone.getDueAt() == null || Instant.now().isBefore(milestone.getDueAt())) {
            throw new AppException(ErrorCode.MILESTONE_NOT_OVERDUE, "Milestone này chưa quá hạn deadline để hủy");
        }

        // Hoàn tiền ký quỹ 100% về ví Người đặt nội dung (Customer)
        escrowService.refundMilestoneEscrow(milestoneId, "Hủy milestone do Creator trễ hạn bàn giao");

        // Hủy hợp đồng & đồng bộ trạng thái Commission (nếu có)
        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);

        if (contract.getHireRequest() != null) {
            contract.getHireRequest().setStatus(CommissionStatus.CANCELLED.name());
            commissionRepository.save(contract.getHireRequest());
        }

        Milestone updated = milestoneRepository.findById(milestoneId).orElse(milestone);
        log.info("Requester {} cancelled overdue milestone {}, contract {} cancelled", currentUser.getEmail(), milestoneId, contract.getId());
        return toMilestoneResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilestoneResponse> getMilestonesByContract(Long contractId) {
        return milestoneRepository.findByContractIdOrderByOrderNoAsc(contractId).stream()
                .map(this::toMilestoneResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MilestoneResponse getMilestoneById(Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));
        return toMilestoneResponse(milestone);
    }

    private void validateEditableContract(Contract contract) {
        if (contract.getStatus() != ContractStatus.PENDING && contract.getStatus() != ContractStatus.REJECTED) {
            throw new AppException(ErrorCode.MILESTONE_EDIT_NOT_ALLOWED,
                    "Chỉ có thể chỉnh sửa hoặc xóa milestone khi hợp đồng đang ở trạng thái PENDING hoặc REJECTED (trạng thái hiện tại: " + contract.getStatus() + ")");
        }
        List<Milestone> allMilestones = milestoneRepository.findByContractIdOrderByOrderNoAsc(contract.getId());
        for (Milestone m : allMilestones) {
            if (m.getEscrowStatus() != null
                    || (m.getStatus() != MilestoneStatus.WAITING && m.getStatus() != MilestoneStatus.UNFUNDED)) {
                throw new AppException(ErrorCode.MILESTONE_EDIT_NOT_ALLOWED,
                        "Không thể chỉnh sửa hoặc xóa milestone khi đã có milestone được nạp tiền ký quỹ");
            }
        }
    }

    private void recalculateContractAndMilestones(Contract contract, List<Milestone> milestones) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (Milestone m : milestones) {
            totalAmount = totalAmount.add(m.getAmount());
        }

        BigDecimal feePercent = contract.getPlatformFeePercent() != null
                ? contract.getPlatformFeePercent()
                : (properties.getPlatformFeePercent() != null ? properties.getPlatformFeePercent() : new BigDecimal("5.0"));
        BigDecimal totalPlatformFee = totalAmount.multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal totalNetAmount = totalAmount.subtract(totalPlatformFee);

        BigDecimal accumulatedFee = BigDecimal.ZERO;
        for (int i = 0; i < milestones.size(); i++) {
            Milestone m = milestones.get(i);
            m.setOrderNo(i + 1);
            m.setStatus(MilestoneStatus.WAITING);
            m.setFundDueAt(null);

            boolean isLast = (i == milestones.size() - 1);
            BigDecimal mFee;
            if (isLast) {
                mFee = totalPlatformFee.subtract(accumulatedFee);
            } else {
                mFee = m.getAmount().multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                accumulatedFee = accumulatedFee.add(mFee);
            }
            m.setPlatformFee(mFee);
            m.setNetAmount(m.getAmount().subtract(mFee));
            milestoneRepository.save(m);
        }

        contract.setTotalAmount(totalAmount);
        contract.setPlatformFee(totalPlatformFee);
        contract.setNetAmount(totalNetAmount);
        contract.setStatus(ContractStatus.PENDING);
        contract.setAcceptDueAt(Instant.now().plus(properties.getContractAcceptHours(), ChronoUnit.HOURS));
        contractRepository.save(contract);

        if (contract.getHireRequest() != null) {
            contract.getHireRequest().setStatus(CommissionStatus.CONTRACT_SENT.name());
            commissionRepository.save(contract.getHireRequest());
        }
    }

    private ContractResponse toContractResponse(Contract c, List<Milestone> milestones) {
        List<MilestoneResponse> milestoneResponses = milestones.stream()
                .map(this::toMilestoneResponse)
                .toList();

        Commission hr = c.getHireRequest();
        Long hireRequestId = hr != null ? hr.getId() : null;
        Long channelId = (hr != null && hr.getChannel() != null) ? hr.getChannel().getId() : null;
        String channelName = (hr != null && hr.getChannel() != null) ? hr.getChannel().getName() : null;
        String conversationId = hr != null ? "hire_request_" + hr.getId() : "contract_" + c.getId();

        Long requesterId = c.getFreelancer() != null ? c.getFreelancer().getId() : null;
        String requesterFullName = c.getFreelancer() != null ? c.getFreelancer().getFullName() : null;
        String requesterAvatarUrl = c.getFreelancer() != null ? c.getFreelancer().getAvatarUrl() : null;

        return ContractResponse.builder()
                .id(c.getId())
                .hireRequestId(hireRequestId)
                .channelId(channelId)
                .channelName(channelName)
                .conversationId(conversationId)
                .creatorId(c.getCreator() != null ? c.getCreator().getId() : null)
                .creatorFullName(c.getCreator() != null ? c.getCreator().getFullName() : null)
                .creatorAvatarUrl(c.getCreator() != null ? c.getCreator().getAvatarUrl() : null)
                .requesterId(requesterId)
                .requesterFullName(requesterFullName)
                .requesterAvatarUrl(requesterAvatarUrl)
                .freelancerId(requesterId)
                .freelancerFullName(requesterFullName)
                .freelancerAvatarUrl(requesterAvatarUrl)
                .serviceType(c.getServiceType())
                .title(c.getTitle())
                .description(c.getDescription())
                .totalAmount(c.getTotalAmount())
                .platformFeePercent(c.getPlatformFeePercent())
                .platformFee(c.getPlatformFee())
                .netAmount(c.getNetAmount())
                .termsText(c.getTermsText())
                .status(c.getStatus())
                .acceptedAt(c.getAcceptedAt())
                .acceptDueAt(c.getAcceptDueAt())
                .milestones(milestoneResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private MilestoneResponse toMilestoneResponse(Milestone m) {
        EscrowStatus escrowStatus = m.getEscrowStatus();

        List<SubmissionResponse> submissions = submissionRepository.findByMilestoneIdOrderByVersionNoDesc(m.getId()).stream()
                .map(s -> SubmissionResponse.builder()
                        .id(s.getId())
                        .milestoneId(m.getId())
                        .versionNo(s.getVersionNo())
                        .content(s.getContent())
                        .fileUrl(s.getFileUrl())
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();

        List<RevisionRequestResponse> revisions = revisionRequestRepository.findByMilestoneIdOrderByCreatedAtDesc(m.getId()).stream()
                .map(r -> RevisionRequestResponse.builder()
                        .id(r.getId())
                        .milestoneId(m.getId())
                        .submissionId(r.getSubmission() != null ? r.getSubmission().getId() : null)
                        .note(r.getNote())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();

        List<MilestoneDeliverableResponse> deliverables = deliverableRepository.findByMilestoneIdOrderByCreatedAtDesc(m.getId()).stream()
                .map(d -> MilestoneDeliverableResponse.builder()
                        .id(d.getId())
                        .milestoneId(m.getId())
                        .milestoneOrderNo(m.getOrderNo())
                        .milestoneTitle(m.getTitle())
                        .contractId(m.getContract() != null ? m.getContract().getId() : null)
                        .contractTitle(m.getContract() != null ? m.getContract().getTitle() : null)
                        .title(d.getTitle())
                        .description(d.getDescription())
                        .fileName(d.getFileName())
                        .fileSize(d.getFileSize())
                        .contentType(d.getContentType())
                        .versionNo(d.getVersionNo())
                        .uploadedById(d.getUploadedBy() != null ? d.getUploadedBy().getId() : null)
                        .uploadedByFullName(d.getUploadedBy() != null ? d.getUploadedBy().getFullName() : null)
                        .downloadUrl("/api/v1/deliverables/" + d.getId() + "/download")
                        .previewUrl("/api/v1/deliverables/" + d.getId() + "/view")
                        .createdAt(d.getCreatedAt())
                        .build())
                .toList();

        List<MilestoneReviewResponse> reviews = milestoneReviewRepository != null
                ? milestoneReviewRepository.findByMilestoneIdOrderByCreatedAtDesc(m.getId()).stream()
                    .map(r -> MilestoneReviewResponse.builder()
                            .id(r.getId())
                            .milestoneId(m.getId())
                            .milestoneOrderNo(m.getOrderNo())
                            .milestoneTitle(m.getTitle())
                            .contractId(m.getContract() != null ? m.getContract().getId() : null)
                            .contractTitle(m.getContract() != null ? m.getContract().getTitle() : null)
                            .reviewerId(r.getReviewer().getId())
                            .reviewerFullName(r.getReviewer().getFullName())
                            .reviewerAvatarUrl(r.getReviewer().getAvatarUrl())
                            .revieweeId(r.getReviewee().getId())
                            .revieweeFullName(r.getReviewee().getFullName())
                            .revieweeAvatarUrl(r.getReviewee().getAvatarUrl())
                            .rating(r.getRating())
                            .comment(r.getComment())
                            .createdAt(r.getCreatedAt())
                            .build())
                    .toList()
                : java.util.Collections.emptyList();

        return MilestoneResponse.builder()
                .id(m.getId())
                .contractId(m.getContract().getId())
                .orderNo(m.getOrderNo())
                .title(m.getTitle())
                .requirement(m.getRequirement())
                .amount(m.getAmount())
                .durationDays(m.getDurationDays())
                .maxRevisions(m.getMaxRevisions())
                .revisionsUsed(m.getRevisionsUsed())
                .revisionDays(m.getRevisionDays())
                .status(m.getStatus())
                .fundDueAt(m.getFundDueAt())
                .dueAt(m.getDueAt())
                .reviewDueAt(m.getReviewDueAt())
                .releaseAt(m.getReleaseAt())
                .escrowStatus(escrowStatus)
                .platformFee(m.getPlatformFee())
                .netAmount(m.getNetAmount())
                .fundedAt(m.getFundedAt())
                .releasedAt(m.getReleasedAt())
                .refundedAt(m.getRefundedAt())
                .submissions(submissions)
                .revisionRequests(revisions)
                .deliverables(deliverables)
                .reviews(reviews)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
