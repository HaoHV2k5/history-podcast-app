package com.prm.contract.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long contractId;
    private Long reviewerId;
    private String reviewerFullName;
    private String reviewerAvatarUrl;
    private Long revieweeId;
    private String revieweeFullName;
    private Integer rating;
    private String comment;
    private Instant createdAt;
}
