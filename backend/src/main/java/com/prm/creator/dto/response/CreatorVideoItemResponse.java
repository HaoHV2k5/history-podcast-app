package com.prm.creator.dto.response;

import lombok.*;

import java.math.BigDecimal;
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

    // Chỉ số & Trạng thái kiểm duyệt AI Shield
    private BigDecimal aiShieldScore;
    private String aiShieldTier;
    private String aiShieldTierLabel;
    private String aiShieldReason;
    private String moderationDecision;
    private String moderationReason;
}
