package com.prm.channel.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeriesItemResponse {

    private Long id;
    private Long seriesId;
    private Long contentId;
    private Integer orderNo;
    private String title;
    private String description;
    private String thumbnailUrl;
    private String mediaUrl;
    private Integer durationSeconds;
    private Boolean isExclusive;
    private String status;
    private Instant createdAt;
}
