package com.prm.social.service;

import com.prm.social.dto.request.CommentRequest;
import com.prm.social.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {
    List<CommentResponse> findAll();
    CommentResponse findById(Long id);
    CommentResponse create(CommentRequest request);
    CommentResponse update(Long id, CommentRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Comment
}
