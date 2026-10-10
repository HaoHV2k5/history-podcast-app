package com.prm.channel.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeriesDetailResponse {

    private Long id;
    private Long channelId;
    private String channelName;
    private String channelAvatarUrl;
    private String title;
    private String description;
    private String coverUrl;
    private String status;
    private int itemCount;
    private int totalDurationSeconds;
    private List<SeriesItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
}
