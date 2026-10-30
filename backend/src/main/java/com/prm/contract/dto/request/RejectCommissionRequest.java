package com.prm.contract.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectCommissionRequest {

    @NotBlank(message = "Lý do từ chối yêu cầu đặt nội dung không được để trống")
    @Size(max = 1000, message = "Lý do từ chối không được vượt quá 1000 ký tự")
    @Schema(description = "Lý do Creator từ chối đơn đặt làm nội dung", example = "Hiện tại lịch sản xuất Series của kênh đã kín trong tháng này, hẹn bạn dịp khác nhé!")
    private String reason;
}
