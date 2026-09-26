package com.prm.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.contract.entity.Contract;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "escrow_transactions")
public class EscrowTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;
    @Column(name = "amount")
    private BigDecimal amount;
    @Column(name = "commission_amount")
    private BigDecimal commissionAmount;
    @Column(name = "status")
    private String status;
    @Column(name = "locked_at")
    private Instant lockedAt;
    @Column(name = "released_at")
    private Instant releasedAt;
}
