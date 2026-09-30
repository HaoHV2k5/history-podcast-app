package com.prm.creator.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorAiSettingRequest {

    @Size(max = 255, message = "Gemini API key không được vượt quá 255 ký tự")
    private String geminiApiKey;

    @Size(max = 255, message = "ElevenLabs API key không được vượt quá 255 ký tự")
    private String elevenlabsApiKey;

    private String ttsEngine;

    private String voiceName;
}
