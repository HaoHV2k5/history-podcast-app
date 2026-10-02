package com.prm.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống (ví dụ: ACTIVE, INACTIVE, LOCKED)")
    private String status;
}
