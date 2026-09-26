package com.prm.channel.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Content;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "artifacts")
public class Artifact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id")
    private Content content;
    @Column(name = "type")
    private String type;
    @Column(name = "file_url")
    private String fileUrl;
    @Column(name = "source_type")
    private String sourceType;
    @Column(name = "duration_seconds")
    private Integer durationSeconds;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
