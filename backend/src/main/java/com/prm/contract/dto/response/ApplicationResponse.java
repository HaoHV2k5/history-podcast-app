package com.prm.contract.dto.response;

import com.prm.contract.constant.ApplicationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {

    private Long id;
    private Long postId;
    private String postTitle;
    private Long applicantId;
    private String applicantFullName;
    private String applicantAvatarUrl;
    private String applicantHeadline;
    private String applicantServiceTypes;
    private String applicantPortfolioUrl;
    private String applicantVoiceDemoUrl;
    private String message;
    private BigDecimal proposedPrice;
    private ApplicationStatus status;
    private Instant createdAt;
}
