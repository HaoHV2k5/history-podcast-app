package com.prm.contract.entity;

import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.ServiceType;
import com.prm.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id")
    private User freelancer;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", length = 50)
    private ServiceType serviceType;

    @Column(name = "title")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ContractStatus status; // PENDING | ACTIVE | COMPLETED | REJECTED | CANCELLED

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "accept_due_at")
    private Instant acceptDueAt;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderNo ASC")
    @Builder.Default
    private List<Milestone> milestones = new ArrayList<>();

    // Legacy fields for backward compatibility
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hire_request_id")
    private HireRequest hireRequest;

    @Column(name = "terms_text", columnDefinition = "TEXT")
    private String termsText;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "creator_signed_at")
    private Instant creatorSignedAt;

    @Column(name = "narrator_signed_at")
    private Instant narratorSignedAt;

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
            status = ContractStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
