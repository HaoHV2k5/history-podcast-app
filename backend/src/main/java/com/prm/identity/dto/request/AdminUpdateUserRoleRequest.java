package com.prm.identity.dto.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRoleRequest {

    private String roleName; // E.g. "ADMIN", "CREATOR", "VIEWER", "NARRATOR"

    private Long roleId;
}
