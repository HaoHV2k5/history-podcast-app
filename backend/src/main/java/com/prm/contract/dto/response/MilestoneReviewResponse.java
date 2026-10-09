package com.prm.contract.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneReviewResponse {

    private Long id;
    private Long milestoneId;
    private Integer milestoneOrderNo;
    private String milestoneTitle;
    private Long contractId;
    private String contractTitle;
    private Long reviewerId;
    private String reviewerFullName;
    private String reviewerAvatarUrl;
    private Long revieweeId;
    private String revieweeFullName;
    private String revieweeAvatarUrl;
    private Integer rating;
    private String comment;
    private Instant createdAt;
}
