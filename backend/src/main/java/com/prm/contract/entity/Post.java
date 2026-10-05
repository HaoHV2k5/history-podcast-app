package com.prm.contract.entity;

import com.prm.contract.constant.PostStatus;
import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
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
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private PostType type; // BOOKING | JOB_SEEKING

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 50)
    private ServiceType serviceType; // CONTENT | VOICE

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "reference_price", precision = 15, scale = 2)
    private BigDecimal referencePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PostStatus status; // OPEN | IN_CONTRACT | CLOSED | EXPIRED | HIDDEN

    @Column(name = "expires_at")
    private Instant expiresAt;

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
            status = PostStatus.OPEN;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
