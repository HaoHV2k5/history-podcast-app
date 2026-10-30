package com.prm.contract.dto.response;

import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.ServiceType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {

    private Long id;
    private Long hireRequestId;
    private Long channelId;
    private String channelName;
    private String conversationId;

    private Long creatorId;
    private String creatorFullName;
    private String creatorAvatarUrl;

    /**
     * Thông tin Người thuê (Listener/Viewer đặt làm nội dung)
     */
    private Long requesterId;
    private String requesterFullName;
    private String requesterAvatarUrl;

    /**
     * Tương thích ngược với FE cũ
     */
    private Long freelancerId;
    private String freelancerFullName;
    private String freelancerAvatarUrl;

    private ServiceType serviceType;
    private String title;
    private String description;
    private BigDecimal totalAmount;
    private BigDecimal platformFeePercent;
    private BigDecimal platformFee;
    private BigDecimal netAmount;
    private String termsText;
    private ContractStatus status;
    private Instant acceptedAt;
    private Instant acceptDueAt;
    private List<MilestoneResponse> milestones;
    private Instant createdAt;
    private Instant updatedAt;
}
