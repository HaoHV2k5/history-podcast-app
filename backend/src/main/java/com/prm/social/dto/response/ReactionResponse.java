package com.prm.social.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionResponse {
    private Long id;
    private Long artifactId;
    private Long userId;
    private String type;
    private Instant createdAt;
}
