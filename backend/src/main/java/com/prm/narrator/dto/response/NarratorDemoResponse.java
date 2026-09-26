package com.prm.narrator.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarratorDemoResponse {
    private Long id;
    private Long narratorProfileId;
    private String title;
    private String fileUrl;
    private Instant uploadedAt;
}
