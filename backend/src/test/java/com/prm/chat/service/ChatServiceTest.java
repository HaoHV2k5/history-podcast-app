package com.prm.chat.service;

import com.prm.chat.dto.request.GetConversationRequest;
import com.prm.chat.dto.response.ChatConversationResponse;
import com.prm.chat.service.impl.ChatServiceImpl;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.entity.Commission;
import com.prm.contract.entity.Contract;
import com.prm.contract.repository.CommissionRepository;
import com.prm.contract.repository.ContractRepository;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.channel.entity.Channel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CommissionRepository commissionRepository;

    @InjectMocks
    private ChatServiceImpl chatService;

    private User creator;
    private User narrator;
    private User stranger;
    private Channel channel;
    private Commission hireRequest;
    private Contract contract;

    @BeforeEach
    void setUp() {
        creator = User.builder()
                .id(1L)
                .email("creator@test.com")
                .fullName("Creator One")
                .avatarUrl("https://cloudinary.com/creator.png")
                .build();

        narrator = User.builder()
                .id(2L)
                .email("narrator@test.com")
                .fullName("Listener Two")
                .avatarUrl("https://cloudinary.com/narrator.png")
                .build();

        stranger = User.builder()
                .id(99L)
                .email("stranger@test.com")
                .fullName("Stranger")
                .build();

        channel = Channel.builder()
                .id(5L)
                .creator(creator)
                .name("Sử Việt Toàn Thư")
                .build();

        hireRequest = Commission.builder()
                .id(15L)
                .narrator(narrator)
                .creator(creator)
                .channel(channel)
                .contentType("SERIES")
                .title("Series 3 tập Chiến dịch Điện Biên Phủ")
                .description("Đặt làm series 3 tập")
                .status("ACCEPTED")
                .build();

        contract = Contract.builder()
                .id(10L)
                .creator(creator)
                .freelancer(narrator)
                .title("Hợp đồng thu âm giọng đọc")
                .build();
    }

    private void authenticateUser(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList())
        );
    }

    @Test
    @DisplayName("Creator lấy phòng chat hợp đồng độc lập: đối tác là Narrator")
    void getConversation_Contract_AsCreator_Success() {
        authenticateUser("creator@test.com");
        when(userRepository.findByEmail("creator@test.com")).thenReturn(Optional.of(creator));
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));

        GetConversationRequest request = GetConversationRequest.builder()
                .contractId(10L)
                .build();

        ChatConversationResponse response = chatService.getOrCreateConversation(request);

        assertNotNull(response);
        assertEquals("contract_10", response.getConversationId());
        assertEquals(2L, response.getPartnerId());
        assertEquals("Listener Two", response.getPartnerName());
        assertEquals("NARRATOR", response.getPartnerRole());
    }

    @Test
    @DisplayName("Người thuê lấy phòng chat hợp đồng: đối tác là Creator")
    void getConversation_Contract_AsNarrator_Success() {
        authenticateUser("narrator@test.com");
        when(userRepository.findByEmail("narrator@test.com")).thenReturn(Optional.of(narrator));
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));

        GetConversationRequest request = GetConversationRequest.builder()
                .contractId(10L)
                .build();

        ChatConversationResponse response = chatService.getOrCreateConversation(request);

        assertNotNull(response);
        assertEquals("contract_10", response.getConversationId());
        assertEquals(1L, response.getPartnerId());
        assertEquals("Creator One", response.getPartnerName());
        assertEquals("CREATOR", response.getPartnerRole());
    }

    @Test
    @DisplayName("Mở chat theo HireRequest đã ACCEPTED thành công, trả về topicTitle và channelName")
    void getConversation_HireRequest_Accepted_Success() {
        authenticateUser("narrator@test.com");
        when(userRepository.findByEmail("narrator@test.com")).thenReturn(Optional.of(narrator));
        when(commissionRepository.findById(15L)).thenReturn(Optional.of(hireRequest));

        GetConversationRequest request = GetConversationRequest.builder()
                .hireRequestId(15L)
                .build();

        ChatConversationResponse response = chatService.getOrCreateConversation(request);

        assertNotNull(response);
        assertEquals("hire_request_15", response.getConversationId());
        assertEquals("Series 3 tập Chiến dịch Điện Biên Phủ", response.getTopicTitle());
        assertEquals("Sử Việt Toàn Thư", response.getChannelName());
        assertEquals(15L, response.getHireRequestId());
        assertEquals(1L, response.getPartnerId());
        assertEquals("CREATOR", response.getPartnerRole());
    }

    @Test
    @DisplayName("Chặn mở chat khi HireRequest đang PENDING hoặc REJECTED (Gatekeeper)")
    void getConversation_HireRequest_PendingOrRejected_ThrowsChatNotAllowed() {
        authenticateUser("narrator@test.com");
        when(userRepository.findByEmail("narrator@test.com")).thenReturn(Optional.of(narrator));
        hireRequest.setStatus("PENDING");
        when(commissionRepository.findById(15L)).thenReturn(Optional.of(hireRequest));

        GetConversationRequest request = GetConversationRequest.builder()
                .hireRequestId(15L)
                .build();

        AppException ex = assertThrows(AppException.class, () -> chatService.getOrCreateConversation(request));
        assertEquals(ErrorCode.CHAT_NOT_ALLOWED, ex.getErrorCode());

        hireRequest.setStatus("REJECTED");
        AppException exRejected = assertThrows(AppException.class, () -> chatService.getOrCreateConversation(request));
        assertEquals(ErrorCode.CHAT_NOT_ALLOWED, exRejected.getErrorCode());
    }

    @Test
    @DisplayName("Hợp đồng gắn với HireRequest dùng chung mã phòng chat hire_request_{id} để không mất lịch sử chat")
    void getConversation_ContractLinkedToHireRequest_UsesUnifiedConversationId() {
        authenticateUser("creator@test.com");
        when(userRepository.findByEmail("creator@test.com")).thenReturn(Optional.of(creator));
        contract.setHireRequest(hireRequest);
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));

        GetConversationRequest request = GetConversationRequest.builder()
                .contractId(10L)
                .build();

        ChatConversationResponse response = chatService.getOrCreateConversation(request);

        assertNotNull(response);
        assertEquals("hire_request_15", response.getConversationId());
        assertEquals(15L, response.getHireRequestId());
        assertEquals(10L, response.getContractId());
        assertEquals("Sử Việt Toàn Thư", response.getChannelName());
        assertEquals("REQUESTER", response.getPartnerRole());
    }

    @Test
    @DisplayName("Người ngoài cố truy cập chat hợp đồng bị chặn ném CHAT_NOT_ALLOWED")
    void getConversation_Contract_Stranger_ThrowsChatNotAllowed() {
        authenticateUser("stranger@test.com");
        when(userRepository.findByEmail("stranger@test.com")).thenReturn(Optional.of(stranger));
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));

        GetConversationRequest request = GetConversationRequest.builder()
                .contractId(10L)
                .build();

        AppException ex = assertThrows(AppException.class, () -> chatService.getOrCreateConversation(request));
        assertEquals(ErrorCode.CHAT_NOT_ALLOWED, ex.getErrorCode());
    }
}
