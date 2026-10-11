package com.prm.chat.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationResponse {

    /**
     * ID định danh của hội thoại trên Firebase Firestore (ví dụ: contract_10 hoặc post_4_applicant_2)
     */
    private String conversationId;

    /**
     * Thông tin đối tác đang trò chuyện cùng
     */
    private Long partnerId;
    private String partnerName;
    private String partnerEmail;
    private String partnerAvatarUrl;
    private String partnerRole;

    /**
     * Ngữ cảnh cuộc trò chuyện (CONTRACT | APPLICATION)
     */
    private String contextType;
    private Long contextId;
}
