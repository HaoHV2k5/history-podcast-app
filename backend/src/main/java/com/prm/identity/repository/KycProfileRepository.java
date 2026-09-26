package com.prm.identity.repository;

import com.prm.identity.entity.KycProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KycProfileRepository extends JpaRepository<KycProfile, Long> {
}
