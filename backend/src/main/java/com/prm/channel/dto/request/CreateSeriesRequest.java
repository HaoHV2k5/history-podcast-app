package com.prm.channel.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSeriesRequest {

    @NotBlank(message = "Tiêu đề series không được để trống")
    private String title;

    private String description;

    private String coverUrl;

    private String status; // PUBLISHED, HIDDEN, DRAFT (mặc định PUBLISHED)

    private List<Long> contentIds; // Danh sách ID video ban đầu (tùy chọn)
}
