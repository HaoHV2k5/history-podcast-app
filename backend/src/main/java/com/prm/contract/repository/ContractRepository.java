package com.prm.contract.repository;

import com.prm.contract.constant.ContractStatus;
import com.prm.contract.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    Page<Contract> findByCreatorId(Long creatorId, Pageable pageable);

    Page<Contract> findByFreelancerId(Long freelancerId, Pageable pageable);

    @Query("SELECT c FROM Contract c WHERE (c.creator.id = :userId OR c.freelancer.id = :userId) " +
           "AND (:status IS NULL OR c.status = :status)")
    Page<Contract> findMyContracts(
            @Param("userId") Long userId,
            @Param("status") ContractStatus status,
            Pageable pageable
    );

    List<Contract> findByStatusAndAcceptDueAtBefore(ContractStatus status, Instant now);
}
