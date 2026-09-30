package com.prm.creator.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorAiSettingResponse {

    private Long id;
    private Long userId;
    private String geminiApiKey;
    private String elevenlabsApiKey;
    private String ttsEngine;
    private String voiceName;
    private boolean hasGeminiKey;
    private boolean hasElevenlabsKey;
    private Instant updatedAt;
}
