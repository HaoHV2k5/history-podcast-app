package com.prm.contract.dto.response;

import com.prm.contract.constant.PostStatus;
import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private String userHeadline;
    private PostType type;
    private ServiceType serviceType;
    private String title;
    private String description;
    private BigDecimal referencePrice;
    private PostStatus status;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer applicationCount;
}
