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

    @NotNull(message = "Kịch bản (storyboard) không được để trống")
    private Map<String, Object> storyboard;

    @NotNull(message = "Danh sách ảnh minh họa cảnh không được để trống")
    private Map<String, String> sceneImages;

    private String ttsEngine;

    private String voiceName;

    private Long channelId;
}
