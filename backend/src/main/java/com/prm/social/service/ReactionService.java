package com.prm.social.service;

import com.prm.social.dto.request.ReactionRequest;
import com.prm.social.dto.response.ReactionResponse;

import java.util.List;

public interface ReactionService {
    List<ReactionResponse> findAll();
    ReactionResponse findById(Long id);
    ReactionResponse create(ReactionRequest request);
    ReactionResponse update(Long id, ReactionRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Reaction
}
