package com.prm.channel.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFilterLogRequest {
    private Long artifactId;
    private String result;
    private BigDecimal score;
    private String reason;
    private Instant checkedAt;
}
