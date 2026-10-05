package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.request.ApplyPostRequest;
import com.prm.contract.dto.request.CreatePostRequest;
import com.prm.contract.dto.request.UpdatePostRequest;
import com.prm.contract.dto.response.ApplicationResponse;
import com.prm.contract.dto.response.PostResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface PostService {

    PostResponse createPost(CreatePostRequest request);

    PageResponse<PostResponse> searchPosts(
            PostType type,
            ServiceType serviceType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword,
            Pageable pageable
    );

    PostResponse getPostById(Long id);

    PageResponse<PostResponse> getMyPosts(Pageable pageable);

    PostResponse updatePost(Long id, UpdatePostRequest request);

    void deletePost(Long id);

    ApplicationResponse applyToPost(Long postId, ApplyPostRequest request);

    PageResponse<ApplicationResponse> getApplicationsByPost(Long postId, Pageable pageable);

    PageResponse<ApplicationResponse> getMyApplications(Pageable pageable);

    ApplicationResponse chooseApplicant(Long postId, Long applicantId);
}
