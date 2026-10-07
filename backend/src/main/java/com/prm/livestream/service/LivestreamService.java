package com.prm.livestream.service;

import com.prm.common.dto.PageResponse;
import com.prm.livestream.constant.LivestreamStatus;
import com.prm.livestream.dto.request.CreateLivestreamRequest;
import com.prm.livestream.dto.response.LivestreamResponse;
import com.prm.livestream.dto.response.LivestreamTokenResponse;
import org.springframework.data.domain.Pageable;

public interface LivestreamService {

    LivestreamResponse createSession(CreateLivestreamRequest request);

    LivestreamTokenResponse getJoinToken(Long sessionId);

    LivestreamResponse endSession(Long sessionId);

    LivestreamResponse getSession(Long sessionId);

    PageResponse<LivestreamResponse> getLivestreams(LivestreamStatus status, Long channelId, Pageable pageable);
}
