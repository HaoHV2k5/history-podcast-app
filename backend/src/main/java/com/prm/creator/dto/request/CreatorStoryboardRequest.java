package com.prm.creator.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorStoryboardRequest {

    @NotBlank(message = "Vui lòng nhập chủ đề hoặc bài viết lịch sử cần biên tập")
    private String topic;

    @Builder.Default
    private Integer durationSec = 60;

    private String geminiApiKey;
}
