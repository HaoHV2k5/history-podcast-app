package com.prm.creator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorSentencePatchItem {

    @NotNull(message = "Chỉ số thứ tự câu không được để trống")
    private Integer index;

    @NotBlank(message = "Nội dung câu không được để trống")
    private String text;

    @Builder.Default
    private Boolean reRecord = true;
}
