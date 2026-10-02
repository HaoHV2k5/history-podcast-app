package com.prm.creator.dto.response;

import com.prm.common.enums.AiShieldTier;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorVideoDetailResponse {

    private Long contentId;
    private Long artifactId;
    private Long channelId;
    private String channelName;
    private String title;
    private String description;
    private String status;
    private String fileUrl;
    private Integer durationSeconds;
    private Boolean isExclusive;
    private Instant createdAt;
    private Instant updatedAt;

    private long likeCount;
    private long dislikeCount;
    private long commentCount;

    private List<CreatorCommentItemResponse> comments;

    // Chỉ số & Trạng thái kiểm duyệt AI Shield
    private BigDecimal aiShieldScore;
    private AiShieldTier aiShieldTier;
    private String aiShieldTierLabel;
    private String aiShieldReason;
    private String moderationDecision;
    private String moderationReason;
}
