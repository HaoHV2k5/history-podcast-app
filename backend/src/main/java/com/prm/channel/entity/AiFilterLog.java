package com.prm.channel.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Artifact;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ai_filter_logs")
public class AiFilterLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artifact_id")
    private Artifact artifact;
    @Column(name = "result")
    private String result;
    @Column(name = "score")
    private BigDecimal score;
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    @Column(name = "checked_at")
    private Instant checkedAt;
}
