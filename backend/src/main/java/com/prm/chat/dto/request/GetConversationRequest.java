package com.prm.chat.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetConversationRequest {

    /**
     * ID của yêu cầu đặt làm nội dung (HireRequest)
     */
    @Schema(description = "ID yêu cầu đặt làm nội dung (chỉ mở được khi Creator đã ACCEPTED)", example = "5")
    private Long hireRequestId;

    /**
     * ID của hợp đồng / lộ trình Milestone
     */
    @Schema(description = "ID hợp đồng / lộ trình Milestone (nếu gắn với HireRequest sẽ dùng chung phòng chat với HireRequest)", example = "10")
    private Long contractId;

    /**
     * Alias: ID của thỏa thuận cộng tác (Collaboration)
     */
    @Schema(hidden = true)
    private Long collaborationId;

    public Long getEffectiveContractId() {
        return collaborationId != null ? collaborationId : contractId;
    }
}
