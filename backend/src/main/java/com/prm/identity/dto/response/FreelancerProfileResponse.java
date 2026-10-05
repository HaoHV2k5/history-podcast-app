package com.prm.identity.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreelancerProfileResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String userAvatarUrl;
    private String userPhone;
    private String headline;
    private String bio;
    private String skills;
    private String portfolioUrl;
    private String status;
    private Set<String> roles;
    private Instant createdAt;
    private Instant updatedAt;
}
