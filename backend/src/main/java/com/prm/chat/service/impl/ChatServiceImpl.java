package com.prm.chat.service.impl;

import com.prm.chat.dto.request.GetConversationRequest;
import com.prm.chat.dto.response.ChatConversationResponse;
import com.prm.chat.service.ChatService;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.entity.Application;
import com.prm.contract.entity.Contract;
import com.prm.contract.repository.ApplicationRepository;
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
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ChatConversationResponse getOrCreateConversation(GetConversationRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

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
            String partnerRole = currentUserId.equals(creatorId) ? "NARRATOR" : "CREATOR";

            return ChatConversationResponse.builder()
                    .conversationId("contract_" + contract.getId())
                    .partnerId(partner.getId())
                    .partnerName(partner.getFullName() != null ? partner.getFullName() : partner.getEmail())
                    .partnerEmail(partner.getEmail())
                    .partnerAvatarUrl(partner.getAvatarUrl())
                    .partnerRole(partnerRole)
                    .contextType("CONTRACT")
                    .contextId(contract.getId())
                    .build();
        }

        if (request.getPostId() != null && request.getApplicantId() != null) {
            Application application = applicationRepository.findByPostIdAndApplicantId(request.getPostId(), request.getApplicantId())
                    .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND, "Không tìm thấy hồ sơ ứng tuyển bài đăng này"));

            Long currentUserId = currentUser.getId();
            Long postOwnerId = application.getPost().getUser().getId();
            Long applicantId = application.getApplicant().getId();

            if (!currentUserId.equals(postOwnerId) && !currentUserId.equals(applicantId)) {
                throw new AppException(ErrorCode.CHAT_NOT_ALLOWED, "Bạn không có quyền mở cuộc trò chuyện cho bài đăng này");
            }

            User partner = currentUserId.equals(postOwnerId) ? application.getApplicant() : application.getPost().getUser();
            String partnerRole = currentUserId.equals(postOwnerId) ? "NARRATOR" : "CREATOR";

            return ChatConversationResponse.builder()
                    .conversationId("post_" + request.getPostId() + "_applicant_" + request.getApplicantId())
                    .partnerId(partner.getId())
                    .partnerName(partner.getFullName() != null ? partner.getFullName() : partner.getEmail())
                    .partnerEmail(partner.getEmail())
                    .partnerAvatarUrl(partner.getAvatarUrl())
                    .partnerRole(partnerRole)
                    .contextType("APPLICATION")
                    .contextId(application.getId())
                    .build();
        }

        throw new AppException(ErrorCode.CHAT_NOT_ALLOWED, "Yêu cầu cung cấp contractId hoặc postId kèm applicantId hợp lệ");
    }
}
