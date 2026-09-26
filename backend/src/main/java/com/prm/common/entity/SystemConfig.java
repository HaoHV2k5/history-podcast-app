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
@Table(name = "system_configs")
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "key")
    private String key;
    @Column(name = "value", columnDefinition = "TEXT")
    private String value;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedByUser;
    @Column(name = "updated_at")
    private Instant updatedAt;
}
