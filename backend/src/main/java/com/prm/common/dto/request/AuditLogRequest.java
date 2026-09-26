package com.prm.common.dto.request;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {
    private Long actorId;
    private String actionType;
    private String targetType;
    private Long targetId;
    private String note;
    private Instant createdAt;
}
