package com.prm.contract.repository;

import com.prm.contract.constant.DisputeStatus;
import com.prm.contract.entity.Dispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    List<Dispute> findByContractId(Long contractId);

    Optional<Dispute> findByMilestoneIdAndStatus(Long milestoneId, DisputeStatus status);

    boolean existsByMilestoneIdAndStatus(Long milestoneId, DisputeStatus status);

    Page<Dispute> findByStatus(DisputeStatus status, Pageable pageable);
}
