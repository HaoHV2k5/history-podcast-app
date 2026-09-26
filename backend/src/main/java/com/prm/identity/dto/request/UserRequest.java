package com.prm.identity.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    private Long roleId;
    private String email;
    private String phone;
    private String passwordHash;
    private String status;
    private Instant createdAt;
}
