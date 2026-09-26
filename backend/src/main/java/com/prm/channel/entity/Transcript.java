package com.prm.channel.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Artifact;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transcripts")
public class Transcript {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artifact_id")
    private Artifact artifact;
    @Column(name = "text_body", columnDefinition = "TEXT")
    private String textBody;
    @Column(name = "created_at")
    private Instant createdAt;
}
