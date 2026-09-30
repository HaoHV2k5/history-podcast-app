package com.prm.wallet.repository;

import com.prm.wallet.entity.WalletTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Optional<WalletTransaction> findByMerchantTxnRef(String merchantTxnRef);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tx FROM WalletTransaction tx WHERE tx.merchantTxnRef = :ref")
    Optional<WalletTransaction> findByMerchantTxnRefForUpdate(@Param("ref") String ref);

    Page<WalletTransaction> findByWalletId(Long walletId, Pageable pageable);

    @Query("SELECT tx FROM WalletTransaction tx WHERE tx.wallet.user.id = :userId")
    Page<WalletTransaction> findByWalletUserId(@Param("userId") Long userId, Pageable pageable);
}
