package com.prm.contract.service;

import com.prm.contract.dto.request.MilestoneItemRequest;
import com.prm.contract.dto.request.RequestRevisionRequest;
import com.prm.contract.dto.request.SubmitDeliverableRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.dto.response.MilestoneResponse;

import java.util.List;

public interface MilestoneService {

    MilestoneResponse updateMilestone(Long milestoneId, MilestoneItemRequest request);

    ContractResponse deleteMilestone(Long milestoneId);

    MilestoneResponse fundMilestone(Long milestoneId);

    MilestoneResponse submitDeliverable(Long milestoneId, SubmitDeliverableRequest request);

    MilestoneResponse requestRevision(Long milestoneId, RequestRevisionRequest request);

    MilestoneResponse approveMilestone(Long milestoneId);

    MilestoneResponse cancelOverdueMilestone(Long milestoneId);

    List<MilestoneResponse> getMilestonesByContract(Long contractId);

    MilestoneResponse getMilestoneById(Long milestoneId);
}
