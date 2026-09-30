package com.prm.wallet.repository;

import com.prm.wallet.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    Optional<BankAccount> findByUserIdAndVerifiedTrue(Long userId);
    Optional<BankAccount> findByIdAndUserId(Long id, Long userId);
}
