package com.prm.contract.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.request.CreateMilestoneReviewRequest;
import com.prm.contract.dto.response.MilestoneReviewResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.entity.MilestoneReview;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.repository.MilestoneReviewRepository;
import com.prm.contract.service.MilestoneReviewService;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MilestoneReviewServiceImpl implements MilestoneReviewService {

    private final MilestoneReviewRepository milestoneReviewRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;

    @Override
    public MilestoneReviewResponse createMilestoneReview(Long milestoneId, CreateMilestoneReviewRequest request) {
        User reviewer = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));

        if (milestone.getStatus() != MilestoneStatus.APPROVED && milestone.getStatus() != MilestoneStatus.RELEASED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE,
                    "Chỉ có thể đánh giá sau khi giai đoạn đã được duyệt (APPROVED) hoặc giải ngân (RELEASED). Trạng thái hiện tại: " + milestone.getStatus());
        }

        Contract contract = milestone.getContract();
        boolean isCreator = contract.getCreator() != null && contract.getCreator().getId().equals(reviewer.getId());
        boolean isFreelancer = contract.getFreelancer() != null && contract.getFreelancer().getId().equals(reviewer.getId());

        if (!isCreator && !isFreelancer) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Bạn không thuộc thành viên của hợp đồng này");
        }

        if (milestoneReviewRepository.existsByMilestoneIdAndReviewerId(milestoneId, reviewer.getId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS, "Bạn đã gửi đánh giá cho giai đoạn này rồi");
        }

        User reviewee = isCreator ? contract.getFreelancer() : contract.getCreator();

        MilestoneReview review = MilestoneReview.builder()
                .milestone(milestone)
                .contract(contract)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(Instant.now())
                .build();

        MilestoneReview saved = milestoneReviewRepository.save(review);
        log.info("MilestoneReview {} created for milestone #{} (contract {}) by user {} to user {}, rating: {}",
                saved.getId(), milestone.getOrderNo(), contract.getId(), reviewer.getEmail(), reviewee.getEmail(), request.getRating());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilestoneReviewResponse> getReviewsByMilestone(Long milestoneId) {
        return milestoneReviewRepository.findByMilestoneIdOrderByCreatedAtDesc(milestoneId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilestoneReviewResponse> getReviewsByContract(Long contractId) {
        return milestoneReviewRepository.findByContractIdOrderByCreatedAtDesc(contractId).stream()
                .map(this::toResponse)
                .toList();
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
    }

    private MilestoneReviewResponse toResponse(MilestoneReview r) {
        Milestone m = r.getMilestone();
        Contract c = r.getContract();

        return MilestoneReviewResponse.builder()
                .id(r.getId())
                .milestoneId(m.getId())
                .milestoneOrderNo(m.getOrderNo())
                .milestoneTitle(m.getTitle())
                .contractId(c.getId())
                .contractTitle(c.getTitle())
                .reviewerId(r.getReviewer().getId())
                .reviewerFullName(r.getReviewer().getFullName())
                .reviewerAvatarUrl(r.getReviewer().getAvatarUrl())
                .revieweeId(r.getReviewee().getId())
                .revieweeFullName(r.getReviewee().getFullName())
                .revieweeAvatarUrl(r.getReviewee().getAvatarUrl())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
