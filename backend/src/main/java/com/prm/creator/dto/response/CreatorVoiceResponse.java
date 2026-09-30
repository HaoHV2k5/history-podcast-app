package com.prm.creator.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorVoiceResponse {
    private String id;
    private String name;
    private String gender; // "male", "female", "neutral"
    private String engine; // "elevenlabs", "edge-tts"
    private String accent; // "Trầm ấm, hào sảng", "Dịu dàng, truyền cảm"...
    private String recommendedFor; // "Phim tài liệu, chiến trận lịch sử Đại Việt"
    private Double vietnameseRating; // 5.0, 4.8...
    private String previewUrl; // Direct audio URL
    private String sampleText; // Sample Vietnamese historical line
    private List<String> tags; // ["history", "recommended", "podcast", "epic"]
    private boolean isRecommended; // true/false
    private boolean isCloned; // true if custom cloned voice
}
