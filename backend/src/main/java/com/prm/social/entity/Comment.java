package com.prm.social.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Artifact;
import com.prm.identity.entity.User;
import com.prm.social.entity.Comment;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artifact_id")
    private Artifact artifact;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;
    @Column(name = "text_body", columnDefinition = "TEXT")
    private String textBody;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
