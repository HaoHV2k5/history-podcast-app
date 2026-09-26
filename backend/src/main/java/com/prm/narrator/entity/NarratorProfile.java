package com.prm.narrator.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.identity.entity.User;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "narrator_profiles")
public class NarratorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    @Column(name = "languages")
    private String languages;
    @Column(name = "base_rate")
    private BigDecimal baseRate;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
