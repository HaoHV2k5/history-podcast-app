package com.prm.channel.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationReviewRequest {
    private Long artifactId;
    private Long moderatorId;
    private String decision;
    private String reason;
    private Boolean escalated;
    private Instant reviewedAt;
}
