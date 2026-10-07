package com.prm.chat.service;

import com.prm.chat.dto.request.GetConversationRequest;
import com.prm.chat.dto.response.ChatConversationResponse;
import com.prm.chat.service.impl.ChatServiceImpl;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.entity.Application;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Post;
import com.prm.contract.repository.ApplicationRepository;
import com.prm.contract.repository.ContractRepository;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
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
    private ApplicationRepository applicationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatServiceImpl chatService;

    private User creator;
    private User narrator;
    private User stranger;
    private Contract contract;
    private Application application;

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
                .fullName("Narrator Two")
                .avatarUrl("https://cloudinary.com/narrator.png")
                .build();

        stranger = User.builder()
                .id(99L)
                .email("stranger@test.com")
                .fullName("Stranger")
                .build();

        contract = Contract.builder()
                .id(10L)
                .creator(creator)
                .freelancer(narrator)
                .title("Hợp đồng thu âm giọng đọc")
                .build();

        Post post = Post.builder()
                .id(20L)
                .user(creator)
                .title("Cần tuyển giọng đọc miền Bắc")
                .build();

        application = Application.builder()
                .id(30L)
                .post(post)
                .applicant(narrator)
                .build();
    }

    private void authenticateUser(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList())
        );
    }

    @Test
    @DisplayName("Creator lấy phòng chat hợp đồng: đối tác là Narrator")
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
        assertEquals("Narrator Two", response.getPartnerName());
        assertEquals("NARRATOR", response.getPartnerRole());
    }

    @Test
    @DisplayName("Narrator lấy phòng chat hợp đồng: đối tác là Creator")
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

    @Test
    @DisplayName("Mở chat theo bài đăng ứng tuyển thành công")
    void getConversation_Application_Success() {
        authenticateUser("creator@test.com");
        when(userRepository.findByEmail("creator@test.com")).thenReturn(Optional.of(creator));
        when(applicationRepository.findByPostIdAndApplicantId(20L, 2L)).thenReturn(Optional.of(application));

        GetConversationRequest request = GetConversationRequest.builder()
                .postId(20L)
                .applicantId(2L)
                .build();

        ChatConversationResponse response = chatService.getOrCreateConversation(request);

        assertNotNull(response);
        assertEquals("post_20_applicant_2", response.getConversationId());
        assertEquals(2L, response.getPartnerId());
        assertEquals("Narrator Two", response.getPartnerName());
    }
}
