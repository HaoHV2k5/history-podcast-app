package com.prm.channel.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Channel;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contents")
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id")
    private Channel channel;
    @Column(name = "title")
    private String title;
    @Column(name = "text_body", columnDefinition = "TEXT")
    private String textBody;
    @Column(name = "source_type")
    private String sourceType;
    @Column(name = "status")
    private String status;
    @Column(name = "is_exclusive")
    @Builder.Default
    private Boolean isExclusive = false;
    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
}
