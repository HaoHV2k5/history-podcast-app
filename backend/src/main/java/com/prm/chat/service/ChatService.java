package com.prm.chat.service;

import com.prm.chat.dto.request.GetConversationRequest;
import com.prm.chat.dto.response.ChatConversationResponse;

public interface ChatService {

    ChatConversationResponse getOrCreateConversation(GetConversationRequest request);
}
