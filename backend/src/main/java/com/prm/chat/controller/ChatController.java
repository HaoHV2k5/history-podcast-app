package com.prm.chat.controller;

import com.prm.chat.dto.request.GetConversationRequest;
import com.prm.chat.dto.response.ChatConversationResponse;
import com.prm.chat.service.ChatService;
import com.prm.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
@Tag(name = "Chat (Narrator - Creator)", description = "Xác thực và cấp quyền mở phòng chat Firebase Firestore giữa Creator và Narrator")
@SecurityRequirement(name = "Bearer Authentication")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversation")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xác thực & Lấy thông tin phòng chat", 
               description = "Xác minh quyền truy cập theo Contract hoặc Application, trả về conversationId chuẩn định danh trên Firestore và thông tin đối tác")
    public ResponseEntity<ApiResponse<ChatConversationResponse>> getOrCreateConversation(@Valid @RequestBody GetConversationRequest request) {
        ChatConversationResponse response = chatService.getOrCreateConversation(request);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phòng chat thành công", response));
    }
}
