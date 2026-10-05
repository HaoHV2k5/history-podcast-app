package com.prm.contract.repository;

import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByContractIdOrderByOrderNoAsc(Long contractId);

    Optional<Milestone> findByContractIdAndOrderNo(Long contractId, Integer orderNo);

    List<Milestone> findByStatusAndFundDueAtBefore(MilestoneStatus status, Instant now);

    List<Milestone> findByStatusAndReviewDueAtBefore(MilestoneStatus status, Instant now);

    @Query("SELECT m FROM Milestone m WHERE m.status = 'APPROVED' " +
           "AND m.releaseAt <= :now " +
           "AND NOT EXISTS (SELECT d FROM Dispute d WHERE d.milestone.id = m.id AND d.status = 'OPEN')")
    List<Milestone> findApprovedMilestonesReadyForRelease(@Param("now") Instant now);
}
