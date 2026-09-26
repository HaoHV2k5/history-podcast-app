package com.prm.channel.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFilterLogResponse {
    private Long id;
    private Long artifactId;
    private String result;
    private BigDecimal score;
    private String reason;
    private Instant checkedAt;
}
