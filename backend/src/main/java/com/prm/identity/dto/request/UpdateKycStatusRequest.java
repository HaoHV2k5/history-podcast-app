package com.prm.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateKycStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(APPROVED|REJECTED)$", message = "Trạng thái chỉ có thể là APPROVED hoặc REJECTED")
    private String status;

    private String rejectionReason;
}
