package com.prm.identity.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private Long roleId;
    private String roleName;
    private Set<String> roles;
    private Boolean isCreator;
    private Boolean isFreelancer;
    private Boolean isAdmin;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
