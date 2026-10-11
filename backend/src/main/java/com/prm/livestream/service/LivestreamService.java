package com.prm.livestream.service;

import com.prm.common.dto.PageResponse;
import com.prm.livestream.constant.LivestreamStatus;
import com.prm.livestream.dto.request.CreateLivestreamRequest;
import com.prm.livestream.dto.response.LivestreamResponse;
import com.prm.livestream.dto.response.LivestreamTokenResponse;
import org.springframework.data.domain.Pageable;

public interface LivestreamService {

    LivestreamResponse createSession(CreateLivestreamRequest request);

    default LivestreamTokenResponse getJoinToken(Long sessionId) {
        return getJoinToken(sessionId, null);
    }

    LivestreamTokenResponse getJoinToken(Long sessionId, Integer clientUid);

    LivestreamResponse endSession(Long sessionId);

    LivestreamResponse getSession(Long sessionId);

    PageResponse<LivestreamResponse> getLivestreams(LivestreamStatus status, Long channelId, Pageable pageable);

    default void sendChatMessage(Long sessionId, String author, String role, String text) {
        sendChatMessage(sessionId, null, author, role, text);
    }

    void sendChatMessage(Long sessionId, String id, String author, String role, String text);

    java.util.List<com.prm.livestream.dto.response.LivestreamChatMessageResponse> getChatMessages(Long sessionId, long since);
}
