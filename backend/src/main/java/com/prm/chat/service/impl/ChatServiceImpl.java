package com.prm.chat.service.impl;

import com.prm.chat.dto.request.GetConversationRequest;
import com.prm.chat.dto.response.ChatConversationResponse;
import com.prm.chat.service.ChatService;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.constant.CommissionStatus;
import com.prm.contract.entity.Commission;
import com.prm.contract.entity.Contract;
import com.prm.contract.repository.CommissionRepository;
import com.prm.contract.repository.ContractRepository;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final CommissionRepository commissionRepository;

    @Override
    @Transactional(readOnly = true)
    public ChatConversationResponse getOrCreateConversation(GetConversationRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

        if (request.getHireRequestId() != null) {
            Commission commission = commissionRepository.findById(request.getHireRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.HIRE_REQUEST_NOT_FOUND, "Không tìm thấy đơn yêu cầu đặt nội dung"));

            Long currentUserId = currentUser.getId();
            Long creatorId = commission.getCreator().getId();
            Long requesterId = commission.getNarrator().getId();

            if (!currentUserId.equals(creatorId) && !currentUserId.equals(requesterId)) {
                throw new AppException(ErrorCode.CHAT_NOT_ALLOWED, "Bạn không thuộc đơn yêu cầu này để mở cuộc trò chuyện");
            }

            String status = commission.getStatus();
            boolean chatAllowed = CommissionStatus.ACCEPTED.name().equalsIgnoreCase(status)
                    || CommissionStatus.CONTRACT_SENT.name().equalsIgnoreCase(status)
                    || CommissionStatus.COMPLETED.name().equalsIgnoreCase(status);

            if (!chatAllowed) {
                throw new AppException(ErrorCode.CHAT_NOT_ALLOWED,
                        "Phòng chat 1-1 chỉ được mở sau khi Creator chấp nhận đơn yêu cầu đặt nội dung (trạng thái hiện tại: " + status + ")");
            }

            User partner = currentUserId.equals(creatorId) ? commission.getNarrator() : commission.getCreator();
            String partnerRole = currentUserId.equals(creatorId) ? "REQUESTER" : "CREATOR";
            String channelName = commission.getChannel() != null ? commission.getChannel().getName() : null;

            return ChatConversationResponse.builder()
                    .conversationId("hire_request_" + commission.getId())
                    .topicTitle(commission.getTitle())
                    .channelName(channelName)
                    .hireRequestId(commission.getId())
                    .partnerId(partner.getId())
                    .partnerName(partner.getFullName() != null ? partner.getFullName() : partner.getEmail())
                    .partnerEmail(partner.getEmail())
                    .partnerAvatarUrl(partner.getAvatarUrl())
                    .partnerRole(partnerRole)
                    .contextType("HIRE_REQUEST")
                    .contextId(commission.getId())
                    .build();
        }

        Long targetContractId = request.getEffectiveContractId();
        if (targetContractId != null) {
            Contract contract = contractRepository.findById(targetContractId)
                    .orElseThrow(() -> new AppException(ErrorCode.CONTRACT_NOT_FOUND, "Không tìm thấy thỏa thuận cộng tác"));

            Long currentUserId = currentUser.getId();
            Long creatorId = contract.getCreator().getId();
            Long freelancerId = contract.getFreelancer().getId();

            if (!currentUserId.equals(creatorId) && !currentUserId.equals(freelancerId)) {
                throw new AppException(ErrorCode.CHAT_NOT_ALLOWED, "Bạn không thuộc hợp đồng này để mở cuộc trò chuyện");
            }

            User partner = currentUserId.equals(creatorId) ? contract.getFreelancer() : contract.getCreator();
            String partnerRole = currentUserId.equals(creatorId)
                    ? (contract.getHireRequest() != null ? "REQUESTER" : "NARRATOR")
                    : "CREATOR";

            Commission linkedCommission = contract.getHireRequest();
            String conversationId = linkedCommission != null
                    ? "hire_request_" + linkedCommission.getId()
                    : "contract_" + contract.getId();
            Long hireRequestId = linkedCommission != null ? linkedCommission.getId() : null;
            String channelName = (linkedCommission != null && linkedCommission.getChannel() != null)
                    ? linkedCommission.getChannel().getName()
                    : null;

            return ChatConversationResponse.builder()
                    .conversationId(conversationId)
                    .topicTitle(contract.getTitle())
                    .channelName(channelName)
                    .hireRequestId(hireRequestId)
                    .contractId(contract.getId())
                    .partnerId(partner.getId())
                    .partnerName(partner.getFullName() != null ? partner.getFullName() : partner.getEmail())
                    .partnerEmail(partner.getEmail())
                    .partnerAvatarUrl(partner.getAvatarUrl())
                    .partnerRole(partnerRole)
                    .contextType("CONTRACT")
                    .contextId(contract.getId())
                    .build();
        }

        throw new AppException(ErrorCode.CHAT_NOT_ALLOWED, "Yêu cầu cung cấp hireRequestId hoặc contractId hợp lệ");
    }
}
