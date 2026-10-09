package com.prm.contract.service;

import com.prm.contract.dto.response.MilestoneDeliverableResponse;
import com.prm.contract.entity.MilestoneDeliverable;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MilestoneDeliverableService {

    MilestoneDeliverableResponse uploadDeliverable(Long milestoneId, String title, String description, MultipartFile file);

    List<MilestoneDeliverableResponse> getDeliverablesByMilestone(Long milestoneId);

    List<MilestoneDeliverableResponse> getDeliverablesByPost(Long postId);

    Resource downloadDeliverable(Long deliverableId);

    MilestoneDeliverable getDeliverableEntity(Long deliverableId);
}
