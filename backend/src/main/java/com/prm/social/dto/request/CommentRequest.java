package com.prm.social.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    private Long artifactId;
    private Long userId;
    private Long parentCommentId;
    private String textBody;
    private String status;
    private Instant createdAt;
}
