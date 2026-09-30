package com.prm.wallet.repository;

import com.prm.wallet.entity.Withdrawal;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Withdrawal w WHERE w.id = :id")
    Optional<Withdrawal> findByIdForUpdate(@Param("id") Long id);

    boolean existsByWalletIdAndStatusIn(Long walletId, Collection<String> statuses);

    @Query("SELECT w FROM Withdrawal w WHERE w.wallet.user.id = :userId")
    Page<Withdrawal> findByWalletUserId(@Param("userId") Long userId, Pageable pageable);
}
