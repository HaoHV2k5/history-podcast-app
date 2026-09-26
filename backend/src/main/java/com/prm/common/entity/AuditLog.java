package com.prm.common.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.identity.entity.User;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;
    @Column(name = "action_type")
    private String actionType;
    @Column(name = "target_type")
    private String targetType;
    @Column(name = "target_id")
    private Long targetId;
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
    @Column(name = "created_at")
    private Instant createdAt;
}
