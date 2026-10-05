package com.prm.contract.entity;

import com.prm.contract.constant.EscrowStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "escrow_payments")
public class EscrowPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false, unique = true)
    private Milestone milestone;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "platform_fee", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Column(name = "net_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private EscrowStatus status; // HELD | RELEASED | REFUNDED | FROZEN

    @Column(name = "funded_at")
    private Instant fundedAt;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (status == null) {
            status = EscrowStatus.HELD;
        }
        if (platformFee == null) {
            platformFee = BigDecimal.ZERO;
        }
        if (netAmount == null && amount != null) {
            netAmount = amount.subtract(platformFee);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
