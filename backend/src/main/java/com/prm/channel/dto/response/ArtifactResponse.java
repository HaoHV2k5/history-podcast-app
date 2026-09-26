package com.prm.channel.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtifactResponse {
    private Long id;
    private Long contentId;
    private String type;
    private String fileUrl;
    private String sourceType;
    private Integer durationSeconds;
    private String status;
    private Instant createdAt;
}
