package com.prm.contract.repository;

import com.prm.contract.entity.RevisionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RevisionRequestRepository extends JpaRepository<RevisionRequest, Long> {

    List<RevisionRequest> findByMilestoneIdOrderByCreatedAtDesc(Long milestoneId);
}
