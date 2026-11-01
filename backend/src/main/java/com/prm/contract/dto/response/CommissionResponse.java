package com.prm.contract.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionResponse {

    private Long id;

    /**
     * Thông tin Người nghe đặt làm nội dung (Requester / Viewer)
     */
    private Long requesterId;
    private String requesterFullName;
    private String requesterEmail;
    private String requesterAvatarUrl;

    /**
     * Tương thích ngược với FE/Mobile cũ nếu còn đọc trường narratorId
     */
    private Long narratorId;

    /**
     * Thông tin Creator & Kênh nhận đặt hàng
     */
    private Long creatorId;
    private String creatorFullName;
    private String creatorEmail;
    private String creatorAvatarUrl;

    private Long channelId;
    private String channelName;
    private String channelAvatarUrl;

    /**
     * Chi tiết yêu cầu đặt nội dung
     */
    private String contentType;
    private String title;
    private String description;
    private String status;
    private String rejectionReason;

    /**
     * Liên kết Hợp đồng & Phòng Chat 1-1 (chỉ cấp khi status >= ACCEPTED)
     */
    private Long contractId;
    private String contractStatus;
    private String conversationId;

    private Instant createdAt;
    private Instant updatedAt;
}
