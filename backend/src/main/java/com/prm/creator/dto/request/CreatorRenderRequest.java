package com.prm.creator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorRenderRequest {

    @NotBlank(message = "Tiêu đề video không được để trống")
    private String title;

    @Builder.Default
    private Integer durationSec = 60;

    private Map<String, Object> storyboard;

    private Map<String, String> sceneImages;

    private String ttsEngine;

    private String voiceName;

    private Long channelId;

    /**
     * Chế độ render:
     * - "whiteboard" (Mặc định): Render hoạt họa vẽ tay bảng trắng từng cảnh
     * - "audio_podcast" hoặc "podcast": Render video Podcast dạng Audio thuyết minh kèm ảnh bìa & phụ đề
     */
    @Builder.Default
    private String renderMode = "whiteboard";

    /**
     * Kịch bản thuyết minh dạng văn bản thuần túy (cho chế độ audio_podcast)
     */
    private String scriptText;

    /**
     * URL hoặc Base64 ảnh bìa đại diện của video Podcast (tùy chọn)
     */
    private String coverImage;
}
