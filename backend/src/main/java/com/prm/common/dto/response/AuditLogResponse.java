package com.prm.common.dto.response;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long actorId;
    private String actionType;
    private String targetType;
    private Long targetId;
    private String note;
    private Instant createdAt;
}
