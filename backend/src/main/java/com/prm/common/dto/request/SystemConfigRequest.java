package com.prm.common.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigRequest {
    private String key;
    private String value;
    private Long updatedByUserId;
    private Instant updatedAt;
}
