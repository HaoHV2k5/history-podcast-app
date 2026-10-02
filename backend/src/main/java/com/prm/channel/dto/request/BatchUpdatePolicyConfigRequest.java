package com.prm.channel.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdatePolicyConfigRequest {

    @NotEmpty(message = "Danh sách cấu hình chính sách không được để trống")
    @Valid
    private List<AiShieldPolicyConfigRequest> configs;
}
