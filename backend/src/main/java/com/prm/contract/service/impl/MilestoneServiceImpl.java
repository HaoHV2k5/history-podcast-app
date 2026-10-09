package com.prm.contract.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.request.RequestRevisionRequest;
import com.prm.contract.dto.request.SubmitDeliverableRequest;
import com.prm.contract.dto.response.MilestoneDeliverableResponse;
import com.prm.contract.dto.response.MilestoneResponse;
import com.prm.contract.dto.response.MilestoneReviewResponse;
import com.prm.contract.dto.response.RevisionRequestResponse;
import com.prm.contract.dto.response.SubmissionResponse;
import com.prm.contract.entity.*;
import com.prm.contract.repository.*;
import com.prm.contract.service.EscrowService;
import com.prm.contract.service.MilestoneService;
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

    @Override
    public MilestoneResponse fundMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator của hợp đồng mới có quyền ký quỹ milestone");
        }

        if (milestone.getStatus() != MilestoneStatus.UNFUNDED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái chờ ký quỹ (UNFUNDED): " + milestone.getStatus());
        }

        BigDecimal amount = milestone.getAmount();

        // 1. Kiểm tra số dư ví và khóa ví Creator
        Wallet creatorWallet = walletRepository.findByUserIdForUpdate(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND, "Không tìm thấy ví của bạn"));

        if (creatorWallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_WALLET_BALANCE,
                    "Số dư ví khả dụng không đủ để ký quỹ milestone (Cần " + amount + " VND, hiện có " + creatorWallet.getAvailableBalance() + " VND)");
        }

        // 2. Trừ tiền ví Creator
        creatorWallet.setAvailableBalance(creatorWallet.getAvailableBalance().subtract(amount));
        walletRepository.save(creatorWallet);

        // 3. Ghi nhận giao dịch trừ tiền
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(creatorWallet)
                .type("FUND_ESCROW")
                .amount(amount.negate())
                .relatedType("MILESTONE")
                .relatedId(milestone.getId())
                .status("SUCCESS")
                .description("Ký quỹ Milestone #" + milestone.getOrderNo() + ": " + milestone.getTitle())
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        // 4. Cập nhật các trường ký quỹ & hoa hồng: Milestone trung gian phí = 0, Milestone cuối cùng chịu toàn bộ phí hợp đồng
        if (milestone.getPlatformFee() == null || milestone.getNetAmount() == null) {
            List<Milestone> allMilestones = milestoneRepository.findByContractIdOrderByOrderNoAsc(contract.getId());
            boolean isLast = allMilestones.isEmpty() || allMilestones.get(allMilestones.size() - 1).getId().equals(milestone.getId());
            BigDecimal contractFee = contract.getPlatformFee() != null
                    ? contract.getPlatformFee()
                    : amount.multiply(properties.getPlatformFeePercent()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal fee = isLast ? contractFee : BigDecimal.ZERO;
            milestone.setPlatformFee(fee);
            milestone.setNetAmount(amount.subtract(fee));
        }

        milestone.setEscrowStatus(EscrowStatus.HELD);
        milestone.setFundedAt(Instant.now());

        // 5. Chuyển trạng thái Milestone sang IN_PROGRESS và bắt đầu tính deadline
        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        milestone.setDueAt(Instant.now().plus(milestone.getDurationDays(), ChronoUnit.DAYS));
        Milestone saved = milestoneRepository.save(milestone);

        log.info("Milestone {} funded successfully by creator {}, due at {}", milestoneId, currentUser.getEmail(), saved.getDueAt());
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse submitDeliverable(Long milestoneId, SubmitDeliverableRequest request) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getFreelancer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Freelancer nhận việc mới có quyền nộp bài");
        }

        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái đang thực hiện (IN_PROGRESS)");
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

        log.info("Freelancer {} submitted work for milestone {} (version {})", currentUser.getEmail(), milestoneId, nextVersion);
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse requestRevision(Long milestoneId, RequestRevisionRequest request) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator của hợp đồng mới có quyền yêu cầu chỉnh sửa");
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
        milestone.setDueAt(Instant.now().plus(properties.getRevisionDays(), ChronoUnit.DAYS));
        milestone.setReviewDueAt(null);
        Milestone saved = milestoneRepository.save(milestone);

        log.info("Creator {} requested revision for milestone {}, revision count: {}",
                currentUser.getEmail(), milestoneId, saved.getRevisionsUsed());
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse approveMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId()) && !currentUser.hasRole("ADMIN")) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator mới có quyền duyệt milestone");
        }

        if (milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái SUBMITTED để duyệt");
        }

        // 1. Chuyển sang APPROVED, set releaseAt = now + RELEASE_HOLD_DAYS
        milestone.setStatus(MilestoneStatus.APPROVED);
        milestone.setReleaseAt(Instant.now().plus(properties.getReleaseHoldDays(), ChronoUnit.DAYS));
        Milestone saved = milestoneRepository.save(milestone);

        // 2. Kích hoạt Milestone kế tiếp chuyển sang UNFUNDED nếu có
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

        log.info("Milestone {} APPROVED by {}, release scheduled at {}", milestoneId, currentUser.getEmail(), saved.getReleaseAt());
        return toMilestoneResponse(saved);
    }

    @Override
    public MilestoneResponse cancelOverdueMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        if (!contract.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Creator mới có quyền hủy milestone quá hạn");
        }

        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Chỉ milestone IN_PROGRESS mới có thể bị hủy vì trễ hạn");
        }

        if (milestone.getDueAt() == null || Instant.now().isBefore(milestone.getDueAt())) {
            throw new AppException(ErrorCode.MILESTONE_NOT_OVERDUE, "Milestone này chưa quá hạn deadline để hủy");
        }

        // Hoàn tiền ký quỹ về ví Creator
        escrowService.refundMilestoneEscrow(milestoneId, "Hủy milestone do Freelancer trễ hạn");

        // Hủy hợp đồng
        contract.setStatus(ContractStatus.CANCELLED);
        contractRepository.save(contract);

        Milestone updated = milestoneRepository.findById(milestoneId).orElse(milestone);
        log.info("Creator {} cancelled overdue milestone {}, contract {} cancelled", currentUser.getEmail(), milestoneId, contract.getId());
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
                        .postId(d.getPost() != null ? d.getPost().getId() : null)
                        .postTitle(d.getPost() != null ? d.getPost().getTitle() : null)
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
