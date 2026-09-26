package com.prm.channel.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptRequest {
    private Long artifactId;
    private String textBody;
    private Instant createdAt;
}
