package com.prm.creator.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorVideoItemResponse {

    private Long contentId;
    private Long artifactId;
    private Long channelId;
    private String channelName;
    private String title;
    private String description;
    private String status; // PUBLISHED, HIDDEN, FAILED, PROCESSING
    private String fileUrl;
    private Integer durationSeconds;
    private Boolean isExclusive;
    private Instant createdAt;
    private Instant updatedAt;

    // Chỉ số tương tác (Engagement metrics)
    private long likeCount;
    private long dislikeCount;
    private long commentCount;
}
