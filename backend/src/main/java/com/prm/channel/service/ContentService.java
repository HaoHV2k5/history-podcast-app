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
     * Tìm kiếm và lọc video công khai cho người xem (người dùng chưa đăng nhập hoặc đã đăng nhập).
     * Hỗ trợ tìm kiếm theo từ khóa (tự động trim khoảng trắng), lọc trạng thái xuất bản, lọc hội viên VIP và sắp xếp.
     */
    List<PublicVideoItemResponse> searchPublicVideos(
            String keyword,
            String status,
            Long channelId,
            Boolean isExclusive,
            String sortBy,
            String sortDir
    );

    default List<PublicVideoItemResponse> searchPublicVideos(
            String keyword,
            Long channelId,
            Boolean isExclusive,
            String sortBy,
            String sortDir
    ) {
        return searchPublicVideos(keyword, "PUBLISHED", channelId, isExclusive, sortBy, sortDir);
    }
}
