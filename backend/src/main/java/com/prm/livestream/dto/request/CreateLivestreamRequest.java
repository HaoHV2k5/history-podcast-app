package com.prm.livestream.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLivestreamRequest {

    @NotNull(message = "ID kênh không được để trống")
    private Long channelId;

    @NotBlank(message = "Tiêu đề livestream không được để trống")
    private String title;

    private String description;

    private String thumbnailUrl;

    @Builder.Default
    private Boolean isExclusive = false;
}
