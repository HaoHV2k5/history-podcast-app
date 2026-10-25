package com.prm.creator.dto.request;

import jakarta.validation.Valid;
import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorPatchPodcastRequest {

    @Valid
    private List<CreatorSentencePatchItem> patches;

    private List<String> sentences;

    /**
     * Ảnh bìa mới cho Audio Podcast (URL hoặc base64 data URI).
     * Tùy chọn: Nếu để trống, hệ thống tiếp tục sử dụng ảnh bìa hiện tại của video.
     */
    private String coverImage;
}
