package com.prm.contract.dto.request;

import com.prm.contract.constant.DisputeResult;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveDisputeRequest {

    @NotNull(message = "Kết quả phân xử (result) không được để trống")
    private DisputeResult result; // RELEASE_TO_FREELANCER | REFUND_TO_CREATOR | SPLIT

    private BigDecimal splitPercent; // Áp dụng khi result = SPLIT, tỉ lệ % cho Freelancer (ví dụ 60.0)

    private String resolution; // Ghi chú kết luận của Admin
}
