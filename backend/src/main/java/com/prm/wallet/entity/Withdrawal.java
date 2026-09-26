package com.prm.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.wallet.entity.BankAccount;
import com.prm.wallet.entity.Wallet;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "withdrawals")
public class Withdrawal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;
    @Column(name = "amount")
    private BigDecimal amount;
    @Column(name = "status")
    private String status;
    @Column(name = "requested_at")
    private Instant requestedAt;
    @Column(name = "processed_at")
    private Instant processedAt;
    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;
}
