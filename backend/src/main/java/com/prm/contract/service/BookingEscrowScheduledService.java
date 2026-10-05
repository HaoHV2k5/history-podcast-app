package com.prm.contract.service;

import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.constant.PostStatus;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.entity.Post;
import com.prm.contract.repository.ContractRepository;
import com.prm.contract.repository.DisputeRepository;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingEscrowScheduledService {

    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;
    private final PostRepository postRepository;
    private final DisputeRepository disputeRepository;
    private final EscrowService escrowService;
    private final BookingEscrowProperties properties;

    /**
     * Chạy định kỳ theo jobIntervalMinutes (mặc định mỗi 60 phút)
     */
    @Scheduled(fixedRateString = "#{${booking-escrow.job-interval-minutes:60} * 60 * 1000}")
    @Transactional
    public void runPeriodicJobs() {
        log.info("Running periodic background jobs for Booking & Escrow system...");
        Instant now = Instant.now();

        handleExpiredPendingContracts(now);
        handleOverdueMilestoneFunding(now);
        handleAutoApproveSubmissions(now);
        handleAutoReleaseEscrow(now);
        handleExpiredPosts(now);

        log.info("Finished periodic background jobs.");
    }

    /**
     * 1. Hợp đồng quá hạn accept (PENDING và now > acceptDueAt): chuyển sang REJECTED và mở lại bài đăng
     */
    public void handleExpiredPendingContracts(Instant now) {
        List<Contract> expiredContracts = contractRepository.findByStatusAndAcceptDueAtBefore(ContractStatus.PENDING, now);
        for (Contract contract : expiredContracts) {
            log.info("Contract {} expired pending accept time, marking REJECTED", contract.getId());
            contract.setStatus(ContractStatus.REJECTED);
            if (contract.getPost() != null && contract.getPost().getStatus() == PostStatus.IN_CONTRACT) {
                contract.getPost().setStatus(PostStatus.OPEN);
                postRepository.save(contract.getPost());
            }
            contractRepository.save(contract);
        }
    }

    /**
     * 2. Quá hạn ký quỹ M1 hoặc M2+:
     * - M1 quá hạn fundDueAt -> Hợp đồng CANCELLED
     * - M2+ quá hạn fundDueAt + FUND_PAUSE_MAX_DAYS -> Hợp đồng CANCELLED
     */
    public void handleOverdueMilestoneFunding(Instant now) {
        List<Milestone> unfundedList = milestoneRepository.findByStatusAndFundDueAtBefore(MilestoneStatus.UNFUNDED, now);
        for (Milestone m : unfundedList) {
            Contract contract = m.getContract();
            if (contract.getStatus() != ContractStatus.ACTIVE) {
                continue;
            }

            if (m.getOrderNo() == 1) {
                // Quá hạn ký quỹ M1 -> Hủy hợp đồng
                log.info("Milestone #1 of contract {} overdue funding, cancelling contract", contract.getId());
                m.setStatus(MilestoneStatus.CANCELLED);
                milestoneRepository.save(m);

                contract.setStatus(ContractStatus.CANCELLED);
                contractRepository.save(contract);
            } else {
                // M2+ quá hạn: kiểm tra xem đã quá FUND_PAUSE_MAX_DAYS chưa
                Instant maxPauseTime = m.getFundDueAt().plus(properties.getFundPauseMaxDays(), ChronoUnit.DAYS);
                if (now.isAfter(maxPauseTime)) {
                    log.info("Milestone #{} of contract {} paused past {} days, cancelling contract",
                            m.getOrderNo(), contract.getId(), properties.getFundPauseMaxDays());
                    m.setStatus(MilestoneStatus.CANCELLED);
                    milestoneRepository.save(m);

                    contract.setStatus(ContractStatus.CANCELLED);
                    contractRepository.save(contract);
                }
            }
        }
    }

    /**
     * 3. Tự duyệt (SUBMITTED và now > reviewDueAt) -> APPROVED, hẹn release_at, kích hoạt M(k+1) -> UNFUNDED
     */
    public void handleAutoApproveSubmissions(Instant now) {
        List<Milestone> submittedList = milestoneRepository.findByStatusAndReviewDueAtBefore(MilestoneStatus.SUBMITTED, now);
        for (Milestone m : submittedList) {
            log.info("Milestone {} auto-approved (Creator did not review within {} days)", m.getId(), properties.getReviewDays());
            m.setStatus(MilestoneStatus.APPROVED);
            m.setReleaseAt(now.plus(properties.getReleaseHoldDays(), ChronoUnit.DAYS));
            milestoneRepository.save(m);

            // Mở milestone tiếp theo nếu có
            Optional<Milestone> nextMilestoneOpt = milestoneRepository.findByContractIdAndOrderNo(m.getContract().getId(), m.getOrderNo() + 1);
            if (nextMilestoneOpt.isPresent()) {
                Milestone next = nextMilestoneOpt.get();
                if (next.getStatus() == MilestoneStatus.WAITING) {
                    next.setStatus(MilestoneStatus.UNFUNDED);
                    next.setFundDueAt(now.plus(properties.getFundHours(), ChronoUnit.HOURS));
                    milestoneRepository.save(next);
                }
            }
        }
    }

    /**
     * 4. Tự release (APPROVED và now >= releaseAt, không có dispute đang OPEN)
     */
    public void handleAutoReleaseEscrow(Instant now) {
        List<Milestone> readyToRelease = milestoneRepository.findApprovedMilestonesReadyForRelease(now);
        for (Milestone m : readyToRelease) {
            try {
                log.info("Auto-releasing escrow for milestone {}", m.getId());
                escrowService.releaseMilestoneEscrow(m.getId());
            } catch (Exception e) {
                log.error("Failed to auto-release escrow for milestone {}: {}", m.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * 5. Hết hạn bài đăng OPEN (now > expiresAt) -> EXPIRED
     */
    public void handleExpiredPosts(Instant now) {
        List<Post> expiredPosts = postRepository.findByStatusAndExpiresAtBefore(PostStatus.OPEN, now);
        for (Post post : expiredPosts) {
            log.info("Post {} expired, setting status to EXPIRED", post.getId());
            post.setStatus(PostStatus.EXPIRED);
            postRepository.save(post);
        }
    }
}
