package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.dto.request.CreateReviewRequest;
import com.prm.contract.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewService {

    ReviewResponse createReview(Long contractId, CreateReviewRequest request);

    List<ReviewResponse> getReviewsByContract(Long contractId);

    PageResponse<ReviewResponse> getUserReviews(Long userId, Pageable pageable);
}
