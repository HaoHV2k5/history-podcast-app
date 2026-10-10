package com.prm.channel.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderSeriesItemsRequest {

    @NotEmpty(message = "Danh sách ID video (contentIds) không được để trống")
    private List<Long> contentIds; // Danh sách ID video theo thứ tự mới mong muốn
}
