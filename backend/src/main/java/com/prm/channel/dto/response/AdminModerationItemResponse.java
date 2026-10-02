package com.prm.channel.dto.response;

import com.prm.common.enums.AiShieldTier;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminModerationItemResponse {

    private Long reviewId;
    private Long artifactId;
    private Long contentId;
    private Long channelId;
    private String channelName;
    private String creatorEmail;
    private String title;
    private String description;
    private String fileUrl;
    private String optimizedUrl;
    private Integer durationSeconds;
    private String contentStatus; // PENDING_REVIEW, PUBLISHED, REJECTED, etc.
    private String decision; // PENDING, APPROVED, REJECTED
    private String adminReason;
    private String moderatorEmail;
    private Instant reviewedAt;
    private Instant createdAt;

    // AI Shield Evaluation
    private AiShieldTier aiShieldTier; // RED_ALERT, FAIR, GOOD, EXCELLENT
    private String aiShieldTierLabel; // Báo động đỏ, Khá, Tốt, Xuất sắc
    private BigDecimal aiShieldScore;
    private String aiShieldReason;
    private String markdownContent;
}
