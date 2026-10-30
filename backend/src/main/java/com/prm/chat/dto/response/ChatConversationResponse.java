package com.prm.chat.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationResponse {

    /**
     * ID định danh nội bộ của hội thoại trên Firebase Firestore (ví dụ: hire_request_5 hoặc contract_10)
     * Lưu ý: Không hiển thị trực tiếp chuỗi này lên tiêu đề giao diện. Hãy dùng topicTitle / partnerName.
     */
    private String conversationId;

    /**
     * Tiêu đề chủ đề đơn đặt nội dung / hợp đồng để hiển thị trên Header khung chat
     */
    private String topicTitle;

    /**
     * Tên kênh của Creator nhận làm nội dung
     */
    private String channelName;

    /**
     * ID đơn yêu cầu đặt nội dung (nếu có)
     */
    private Long hireRequestId;

    /**
     * ID hợp đồng / lộ trình Milestone (nếu có)
     */
    private Long contractId;

    /**
     * Thông tin đối tác đang trò chuyện cùng
     */
    private Long partnerId;
    private String partnerName;
    private String partnerEmail;
    private String partnerAvatarUrl;
    private String partnerRole;

    /**
     * Ngữ cảnh cuộc trò chuyện (HIRE_REQUEST | CONTRACT | APPLICATION)
     */
    private String contextType;
    private Long contextId;
}
