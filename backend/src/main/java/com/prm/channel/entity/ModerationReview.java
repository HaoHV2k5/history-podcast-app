package com.prm.channel.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Artifact;
import com.prm.identity.entity.User;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "moderation_reviews")
public class ModerationReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artifact_id")
    private Artifact artifact;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderator_id")
    private User moderator;
    @Column(name = "decision")
    private String decision;
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    @Column(name = "escalated")
    private Boolean escalated;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
