package com.prm.channel.service;

import com.prm.channel.dto.request.ModerationReviewRequest;
import com.prm.channel.dto.response.ModerationReviewResponse;

import java.util.List;

public interface ModerationReviewService {
    List<ModerationReviewResponse> findAll();
    ModerationReviewResponse findById(Long id);
    ModerationReviewResponse create(ModerationReviewRequest request);
    ModerationReviewResponse update(Long id, ModerationReviewRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain ModerationReview
}
