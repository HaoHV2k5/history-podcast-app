package com.prm.chat.dto.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetConversationRequest {

    /**
     * ID của hợp đồng / thỏa thuận cộng tác
     */
    private Long contractId;

    /**
     * Alias: ID của thỏa thuận cộng tác (Collaboration)
     */
    private Long collaborationId;

    public Long getEffectiveContractId() {
        return collaborationId != null ? collaborationId : contractId;
    }

    /**
     * ID bài đăng (nếu chat thương lượng lúc ứng tuyển)
     */
    private Long postId;

    /**
     * ID người ứng tuyển (Narrator/Freelancer)
     */
    private Long applicantId;
}
