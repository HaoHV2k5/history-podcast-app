package com.prm.creator.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorVoicePreviewRequest {
    @NotBlank(message = "Công nghệ TTS không được để trống (elevenlabs hoặc edge-tts)")
    private String engine; // "elevenlabs" or "edge-tts"

    @NotBlank(message = "Mã giọng đọc không được để trống")
    private String voiceId; // "Brian", "nPczCjzI2devNBz1zQrb", or "vi-VN-NamMinhNeural"

    private String text; // Optional sample text in Vietnamese
    private String elevenlabsApiKey; // Optional override key
}
