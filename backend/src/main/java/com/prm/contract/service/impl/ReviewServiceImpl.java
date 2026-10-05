package com.prm.contract.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.dto.request.CreateReviewRequest;
import com.prm.contract.dto.response.ReviewResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Review;
import com.prm.contract.repository.ContractRepository;
import com.prm.contract.repository.ReviewRepository;
import com.prm.contract.service.ReviewService;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
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
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;

    @Override
    public ReviewResponse createReview(Long contractId, CreateReviewRequest request) {
        User reviewer = getCurrentUser();
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTRACT_NOT_FOUND, "Không tìm thấy hợp đồng"));

        if (contract.getStatus() != ContractStatus.COMPLETED) {
            throw new AppException(ErrorCode.CONTRACT_NOT_COMPLETED, "Chỉ có thể đánh giá sau khi hợp đồng đã hoàn thành (COMPLETED)");
        }

        boolean isCreator = contract.getCreator().getId().equals(reviewer.getId());
        boolean isFreelancer = contract.getFreelancer().getId().equals(reviewer.getId());
        if (!isCreator && !isFreelancer) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Bạn không thuộc thành viên của hợp đồng này");
        }

        if (reviewRepository.existsByContractIdAndReviewerId(contractId, reviewer.getId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS, "Bạn đã gửi đánh giá cho hợp đồng này rồi");
        }

        User reviewee = isCreator ? contract.getFreelancer() : contract.getCreator();

        Review review = Review.builder()
                .contract(contract)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(Instant.now())
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review {} created for contract {} by user {} to user {}",
                saved.getId(), contractId, reviewer.getEmail(), reviewee.getEmail());

        return toReviewResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByContract(Long contractId) {
        return reviewRepository.findByContractId(contractId).stream()
                .map(this::toReviewResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getUserReviews(Long userId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByRevieweeId(userId, pageable);
        List<ReviewResponse> content = page.getContent().stream()
                .map(this::toReviewResponse)
                .toList();
        return PageResponse.of(page, content);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
    }

    private ReviewResponse toReviewResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .contractId(r.getContract().getId())
                .reviewerId(r.getReviewer().getId())
                .reviewerFullName(r.getReviewer().getFullName())
                .reviewerAvatarUrl(r.getReviewer().getAvatarUrl())
                .revieweeId(r.getReviewee().getId())
                .revieweeFullName(r.getReviewee().getFullName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
