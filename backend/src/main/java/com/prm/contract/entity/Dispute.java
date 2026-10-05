package com.prm.contract.entity;

import com.prm.contract.constant.DisputeResult;
import com.prm.contract.constant.DisputeStatus;
import com.prm.identity.entity.User;
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
@Table(name = "disputes")
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id")
    private Milestone milestone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raised_by", nullable = false)
    private User raisedByUser;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "evidence", columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "counter_evidence", columnDefinition = "TEXT")
    private String counterEvidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private DisputeStatus status; // OPEN | RESOLVED

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 50)
    private DisputeResult result; // RELEASE_TO_FREELANCER | REFUND_TO_CREATOR | SPLIT

    @Column(name = "split_percent", precision = 5, scale = 2)
    private BigDecimal splitPercent; // ví dụ: 60 (60% cho freelancer, 40% cho creator)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedByUser;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

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
            status = DisputeStatus.OPEN;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
