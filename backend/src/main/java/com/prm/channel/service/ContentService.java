package com.prm.channel.service;

import com.prm.channel.dto.request.ContentRequest;
import com.prm.channel.dto.response.ContentResponse;

import java.util.List;

public interface ContentService {
    List<ContentResponse> findAll();
    ContentResponse findById(Long id);
    ContentResponse create(ContentRequest request);
    ContentResponse update(Long id, ContentRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Content
}
