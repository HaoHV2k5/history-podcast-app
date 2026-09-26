package com.prm.social.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {
    private Long artifactId;
    private Long userId;
    private String type;
    private Instant createdAt;
}
