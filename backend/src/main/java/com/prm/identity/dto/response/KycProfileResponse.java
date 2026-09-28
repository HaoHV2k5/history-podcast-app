package com.prm.identity.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycProfileResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String fullName;
    private String phone;
    private String contactEmail;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String bio;
    private String portfolioUrl;
    private String verificationMethod;
    private Instant otpVerifiedAt;
    private String status;
    private String rejectionReason;
    private Instant createdAt;
    private Instant updatedAt;
}
