package com.prm.contract.repository;

import com.prm.contract.entity.MilestoneReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MilestoneReviewRepository extends JpaRepository<MilestoneReview, Long> {

    boolean existsByMilestoneIdAndReviewerId(Long milestoneId, Long reviewerId);

    List<MilestoneReview> findByMilestoneIdOrderByCreatedAtDesc(Long milestoneId);

    List<MilestoneReview> findByContractIdOrderByCreatedAtDesc(Long contractId);

    Page<MilestoneReview> findByRevieweeId(Long revieweeId, Pageable pageable);
}
