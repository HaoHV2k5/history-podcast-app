package com.prm.channel.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationReviewResponse {
    private Long id;
    private Long artifactId;
    private Long moderatorId;
    private String decision;
    private String reason;
    private Boolean escalated;
    private Instant reviewedAt;
}
