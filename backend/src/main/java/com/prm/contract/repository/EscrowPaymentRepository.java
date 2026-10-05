package com.prm.contract.repository;

import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.entity.EscrowPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EscrowPaymentRepository extends JpaRepository<EscrowPayment, Long> {

    Optional<EscrowPayment> findByMilestoneId(Long milestoneId);

    List<EscrowPayment> findByStatus(EscrowStatus status);
}
