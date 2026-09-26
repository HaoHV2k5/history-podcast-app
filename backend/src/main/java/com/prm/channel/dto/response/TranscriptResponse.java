package com.prm.channel.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptResponse {
    private Long id;
    private Long artifactId;
    private String textBody;
    private Instant createdAt;
}
