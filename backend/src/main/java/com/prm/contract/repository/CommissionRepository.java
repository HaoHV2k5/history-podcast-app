package com.prm.contract.repository;

import com.prm.contract.entity.Commission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, Long> {

    boolean existsByNarratorIdAndStatusIn(Long narratorId, Collection<String> statuses);

    @Query("SELECT c FROM Commission c WHERE c.narrator.id = :requesterId " +
           "AND (CAST(:status AS string) IS NULL OR CAST(:status AS string) = '' OR UPPER(c.status) = UPPER(CAST(:status AS string)))")
    Page<Commission> findMySentRequests(
            @Param("requesterId") Long requesterId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT c FROM Commission c WHERE c.creator.id = :creatorId " +
           "AND (CAST(:status AS string) IS NULL OR CAST(:status AS string) = '' OR UPPER(c.status) = UPPER(CAST(:status AS string)))")
    Page<Commission> findMyReceivedRequests(
            @Param("creatorId") Long creatorId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT c FROM Commission c WHERE (c.narrator.id = :userId OR c.creator.id = :userId) " +
           "AND (CAST(:status AS string) IS NULL OR CAST(:status AS string) = '' OR UPPER(c.status) = UPPER(CAST(:status AS string)))")
    Page<Commission> findMyCommissions(
            @Param("userId") Long userId,
            @Param("status") String status,
            Pageable pageable
    );
}
