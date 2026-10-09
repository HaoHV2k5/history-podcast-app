package com.prm.contract.repository;

import com.prm.contract.entity.MilestoneDeliverable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MilestoneDeliverableRepository extends JpaRepository<MilestoneDeliverable, Long> {

    List<MilestoneDeliverable> findByMilestoneIdOrderByCreatedAtDesc(Long milestoneId);

    List<MilestoneDeliverable> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<MilestoneDeliverable> findByMilestoneContractIdOrderByCreatedAtDesc(Long contractId);
}
