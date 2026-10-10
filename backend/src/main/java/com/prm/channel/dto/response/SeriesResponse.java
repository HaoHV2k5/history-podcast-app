package com.prm.channel.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeriesResponse {

    private Long id;
    private Long channelId;
    private String channelName;
    private String title;
    private String description;
    private String coverUrl;
    private String status;
    private int itemCount;
    private int totalDurationSeconds;
    private Instant createdAt;
    private Instant updatedAt;
}
