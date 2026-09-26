package com.prm.contract.repository;

import com.prm.contract.entity.HireRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HireRequestRepository extends JpaRepository<HireRequest, Long> {
}
