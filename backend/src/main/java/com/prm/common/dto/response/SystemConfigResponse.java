package com.prm.common.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigResponse {
    private Long id;
    private String key;
    private String value;
    private Long updatedByUserId;
    private Instant updatedAt;
}
