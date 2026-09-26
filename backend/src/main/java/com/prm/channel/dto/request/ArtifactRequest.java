package com.prm.channel.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtifactRequest {
    private Long contentId;
    private String type;
    private String fileUrl;
    private String sourceType;
    private Integer durationSeconds;
    private String status;
    private Instant createdAt;
}
