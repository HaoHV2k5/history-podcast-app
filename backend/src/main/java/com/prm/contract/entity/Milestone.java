package com.prm.contract.entity;

import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "milestones")
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(name = "order_no", nullable = false)
    private Integer orderNo;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "requirement", nullable = false, columnDefinition = "TEXT")
    private String requirement;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "max_revisions", nullable = false)
    @Builder.Default
    private Integer maxRevisions = 2;

    @Column(name = "revisions_used", nullable = false)
    @Builder.Default
    private Integer revisionsUsed = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private MilestoneStatus status; // WAITING | UNFUNDED | IN_PROGRESS | SUBMITTED | APPROVED | RELEASED | DISPUTED | CANCELLED

    @Column(name = "fund_due_at")
    private Instant fundDueAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "review_due_at")
    private Instant reviewDueAt;

    @Column(name = "release_at")
    private Instant releaseAt;

    @Column(name = "platform_fee", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Column(name = "net_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "escrow_status", length = 50)
    private EscrowStatus escrowStatus;

    @Column(name = "funded_at")
    private Instant fundedAt;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @OneToMany(mappedBy = "milestone", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("versionNo DESC")
    @Builder.Default
    private List<Submission> submissions = new ArrayList<>();

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
            status = MilestoneStatus.WAITING;
        }
        if (maxRevisions == null) {
            maxRevisions = 2;
        }
        if (revisionsUsed == null) {
            revisionsUsed = 0;
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
