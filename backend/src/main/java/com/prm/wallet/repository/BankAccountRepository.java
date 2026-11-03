package com.prm.wallet.repository;

import com.prm.wallet.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByUserIdOrderByIdDesc(Long userId);
    Optional<BankAccount> findByUserIdAndVerifiedTrue(Long userId);
    Optional<BankAccount> findByIdAndUserId(Long id, Long userId);
}
