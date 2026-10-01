package com.prm.identity.repository;

import com.prm.identity.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<PasswordResetToken> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    Optional<PasswordResetToken> findByResetToken(String resetToken);

    Optional<PasswordResetToken> findTopByEmailAndResetTokenAndUsedFalseOrderByCreatedAtDesc(String email, String resetToken);

    Optional<PasswordResetToken> findTopByEmailAndOtpCodeAndUsedFalseOrderByCreatedAtDesc(String email, String otpCode);
}
