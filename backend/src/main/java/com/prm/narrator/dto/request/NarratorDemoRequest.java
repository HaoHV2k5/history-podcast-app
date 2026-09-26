package com.prm.narrator.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarratorDemoRequest {
    private Long narratorProfileId;
    private String title;
    private String fileUrl;
    private Instant uploadedAt;
}
