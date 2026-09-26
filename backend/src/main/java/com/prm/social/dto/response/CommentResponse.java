package com.prm.social.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long artifactId;
    private Long userId;
    private Long parentCommentId;
    private String textBody;
    private String status;
    private Instant createdAt;
}
