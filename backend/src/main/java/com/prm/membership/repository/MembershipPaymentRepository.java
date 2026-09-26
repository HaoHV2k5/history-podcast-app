package com.prm.membership.repository;

import com.prm.membership.entity.MembershipPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembershipPaymentRepository extends JpaRepository<MembershipPayment, Long> {
}
