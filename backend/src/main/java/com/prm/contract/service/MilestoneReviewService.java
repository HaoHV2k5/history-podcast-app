package com.prm.contract.service;

import com.prm.contract.dto.request.CreateMilestoneReviewRequest;
import com.prm.contract.dto.response.MilestoneReviewResponse;

import java.util.List;

public interface MilestoneReviewService {

    MilestoneReviewResponse createMilestoneReview(Long milestoneId, CreateMilestoneReviewRequest request);

    List<MilestoneReviewResponse> getReviewsByMilestone(Long milestoneId);

    List<MilestoneReviewResponse> getReviewsByContract(Long contractId);
}
