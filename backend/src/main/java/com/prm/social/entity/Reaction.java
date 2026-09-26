package com.prm.social.entity;

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
@Table(name = "reactions")
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artifact_id")
    private Artifact artifact;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "type")
    private String type;
    @Column(name = "created_at")
    private Instant createdAt;
}
