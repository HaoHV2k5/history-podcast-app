package com.prm.channel.service;

import com.prm.channel.dto.request.ContentRequest;
import com.prm.channel.dto.response.ContentResponse;
import com.prm.channel.dto.response.PublicVideoItemResponse;

import java.util.List;

public interface ContentService {
    List<ContentResponse> findAll();
    ContentResponse findById(Long id);
    ContentResponse create(ContentRequest request);
    ContentResponse update(Long id, ContentRequest request);
    void delete(Long id);

    /**
     * Tìm kiếm và lọc video công khai cho người xem (chỉ lấy video PUBLISHED).
     */
    List<PublicVideoItemResponse> searchPublicVideos(
            String keyword,
            Long channelId,
            Boolean isExclusive,
            String sortBy,
            String sortDir
    );
}
