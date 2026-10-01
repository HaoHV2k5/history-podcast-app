package com.prm.channel.service.impl;

import com.prm.channel.dto.request.ContentRequest;
import com.prm.channel.dto.response.ContentResponse;
import com.prm.channel.dto.response.PublicVideoItemResponse;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Content;
import com.prm.channel.mapper.ContentMapper;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.service.ContentService;
import com.prm.common.enums.ContentStatus;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.exception.ResourceNotFoundException;
import com.prm.common.util.SearchUtils;
import com.prm.membership.dto.response.MembershipCheckResponse;
import com.prm.membership.service.MembershipService;
import com.prm.social.repository.CommentRepository;
import com.prm.social.repository.ReactionRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ContentServiceImpl implements ContentService {

    private final ContentRepository repository;
    private final ContentMapper mapper;
    private final EntityManager entityManager;
    private final MembershipService membershipService;
    private final ArtifactRepository artifactRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ContentResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContentResponse findById(Long id) {
        Content content = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + id));

        if (Boolean.TRUE.equals(content.getIsExclusive()) && content.getChannel() != null) {
            MembershipCheckResponse check = membershipService.checkMembership(content.getChannel().getId());
            if (!check.isMember()) {
                throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Nội dung này dành riêng cho hội viên của kênh");
            }
        }

        return mapper.toResponse(content);
    }

    @Override
    public ContentResponse create(ContentRequest request) {
        Content entity = mapper.toEntity(request);
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        Content saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ContentResponse update(Long id, ContentRequest request) {
        Content entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        Content updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Content not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicVideoItemResponse> searchPublicVideos(
            String keyword,
            String status,
            Long channelId,
            Boolean isExclusive,
            String sortBy,
            String sortDir
    ) {
        // Đối với người xem / người dùng chưa đăng nhập, mặc định chỉ lấy video đã PUBLISHED
        String targetStatus = ContentStatus.PUBLISHED.name();
        if (StringUtils.hasText(status) && ContentStatus.PUBLISHED.name().equalsIgnoreCase(status.trim())) {
            targetStatus = ContentStatus.PUBLISHED.name();
        }

        List<Content> contents;
        if (channelId != null) {
            contents = repository.findByChannelIdAndStatus(channelId, targetStatus);
        } else {
            contents = repository.findByStatus(targetStatus);
        }

        String cleanKeyword = SearchUtils.normalizeWhitespace(keyword);

        List<PublicVideoItemResponse> result = new ArrayList<>();
        for (Content content : contents) {
            // 1. Lọc theo quyền truy cập độc quyền VIP / Hội viên (null = Tất cả, true = Hội viên VIP, false = Miễn phí)
            if (isExclusive != null) {
                boolean itemIsExclusive = Boolean.TRUE.equals(content.getIsExclusive());
                if (isExclusive != itemIsExclusive) {
                    continue;
                }
            }

            // 2. Tìm kiếm theo từ khóa trong tiêu đề và nội dung kịch bản (tự động trim và chuẩn hóa khoảng trắng thừa)
            if (StringUtils.hasText(cleanKeyword)) {
                boolean matchTitle = SearchUtils.matchesKeyword(content.getTitle(), cleanKeyword);
                boolean matchBody = SearchUtils.matchesKeyword(content.getTextBody(), cleanKeyword);
                if (!matchTitle && !matchBody) {
                    continue;
                }
            }

            Artifact artifact = artifactRepository.findFirstByContentIdOrderByCreatedAtDesc(content.getId()).orElse(null);
            long likeCount = 0;
            long dislikeCount = 0;
            long commentCount = 0;
            String fileUrl = null;
            Integer duration = null;
            Long artifactId = null;

            if (artifact != null) {
                artifactId = artifact.getId();
                fileUrl = StringUtils.hasText(artifact.getOptimizedUrl())
                        ? artifact.getOptimizedUrl()
                        : artifact.getFileUrl();
                duration = artifact.getDurationSeconds();
                likeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "LIKE");
                dislikeCount = reactionRepository.countByArtifactIdAndType(artifact.getId(), "DISLIKE");
                commentCount = commentRepository.countByArtifactId(artifact.getId());
            }

            result.add(PublicVideoItemResponse.builder()
                    .contentId(content.getId())
                    .artifactId(artifactId)
                    .channelId(content.getChannel() != null ? content.getChannel().getId() : null)
                    .channelName(content.getChannel() != null ? content.getChannel().getName() : null)
                    .title(content.getTitle())
                    .description(content.getTextBody())
                    .status(content.getStatus())
                    .fileUrl(fileUrl)
                    .durationSeconds(duration)
                    .isExclusive(content.getIsExclusive())
                    .createdAt(content.getCreatedAt())
                    .updatedAt(content.getUpdatedAt())
                    .likeCount(likeCount)
                    .dislikeCount(dislikeCount)
                    .commentCount(commentCount)
                    .build());
        }

        // 3. Sắp xếp kết quả
        Comparator<PublicVideoItemResponse> comparator = getPublicVideoComparator(sortBy);
        if ("asc".equalsIgnoreCase(sortDir)) {
            result.sort(comparator);
        } else {
            result.sort(comparator.reversed());
        }

        return result;
    }

    private Comparator<PublicVideoItemResponse> getPublicVideoComparator(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            sortBy = "createdAt";
        }
        Comparator<PublicVideoItemResponse> primary;
        switch (sortBy.toLowerCase()) {
            case "title" -> primary = Comparator.comparing(
                    v -> v.getTitle() != null ? v.getTitle().toLowerCase() : "",
                    Comparator.naturalOrder()
            );
            case "likecount", "likes", "like" -> primary = Comparator.comparingLong(PublicVideoItemResponse::getLikeCount);
            case "dislikecount", "dislikes" -> primary = Comparator.comparingLong(PublicVideoItemResponse::getDislikeCount);
            case "commentcount", "comments", "comment" -> primary = Comparator.comparingLong(PublicVideoItemResponse::getCommentCount);
            case "durationseconds", "duration" -> primary = Comparator.comparingInt(
                    v -> v.getDurationSeconds() != null ? v.getDurationSeconds() : 0
            );
            default -> primary = Comparator.comparing(
                    PublicVideoItemResponse::getCreatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
        }

        return primary.thenComparing(
                Comparator.comparing(
                        PublicVideoItemResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
        );
    }
}
