package com.prm.contract.entity;

import com.prm.channel.entity.Channel;
import com.prm.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "hire_requests")
public class Commission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    /**
     * Người nghe gửi yêu cầu đặt làm nội dung (Requester / Viewer)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "narrator_id")
    private User narrator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id")
    private Channel channel;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "proposed_price")
    private BigDecimal proposedPrice;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
        if (contentType == null || contentType.isBlank()) {
            contentType = "SINGLE_VIDEO";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
