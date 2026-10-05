package com.prm.contract.repository;

import com.prm.contract.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByMilestoneIdOrderByVersionNoDesc(Long milestoneId);

    Optional<Submission> findTopByMilestoneIdOrderByVersionNoDesc(Long milestoneId);
}
