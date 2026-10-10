package com.prm.channel.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSeriesRequest {

    @NotBlank(message = "Tiêu đề series không được để trống")
    private String title;

    private String description;

    private String coverUrl;

    private String status; // PUBLISHED, HIDDEN, DRAFT
}
