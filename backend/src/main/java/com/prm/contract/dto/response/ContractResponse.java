package com.prm.contract.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {
    private Long id;
    private Long hireRequestId;
    private String termsText;
    private BigDecimal price;
    private LocalDate deadline;
    private String status;
    private Instant creatorSignedAt;
    private Instant narratorSignedAt;
    private Instant createdAt;
}
