package com.prm.channel.entity;

import com.prm.common.enums.AiShieldTier;
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
@Table(name = "ai_shield_policy_configs")
public class AiShieldPolicyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, unique = true, length = 50)
    private AiShieldTier tier;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "min_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal minScore;

    @Column(name = "max_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "action_type", length = 50)
    private String actionType; // MANUAL_REVIEW, AUTO_FLAG, etc.

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (isActive == null) isActive = true;
        if (actionType == null) actionType = "MANUAL_REVIEW";
        if (displayOrder == null) displayOrder = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
