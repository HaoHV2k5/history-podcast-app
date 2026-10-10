package com.prm.channel.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddSeriesItemRequest {

    @NotNull(message = "ID của video/podcast (contentId) không được để trống")
    private Long contentId;

    private Integer orderNo; // Tùy chọn, nếu null thì tự động xếp vào cuối
}
