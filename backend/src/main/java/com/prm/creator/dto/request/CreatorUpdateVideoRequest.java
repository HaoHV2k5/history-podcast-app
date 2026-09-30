package com.prm.creator.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorUpdateVideoRequest {

    @NotBlank(message = "Tiêu đề video không được để trống")
    private String title;

    private String description;

    private Boolean isExclusive;
}
