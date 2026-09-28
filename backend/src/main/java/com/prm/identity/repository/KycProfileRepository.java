package com.prm.identity.repository;

import com.prm.identity.entity.KycProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KycProfileRepository extends JpaRepository<KycProfile, Long> {

    Optional<KycProfile> findByUserId(Long userId);

    Optional<KycProfile> findTopByUserIdOrderByIdDesc(Long userId);

    @Query("SELECT k FROM KycProfile k WHERE k.user.email = :email ORDER BY k.id DESC")
    Optional<KycProfile> findTopByUserEmail(@Param("email") String email);

    Page<KycProfile> findAllByStatus(String status, Pageable pageable);

    @Query("SELECT k FROM KycProfile k WHERE (:status IS NULL OR k.status = :status)")
    Page<KycProfile> findByStatusFilter(@Param("status") String status, Pageable pageable);
}
