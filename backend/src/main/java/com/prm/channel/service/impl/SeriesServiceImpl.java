package com.prm.channel.service.impl;

import com.prm.channel.dto.request.AddSeriesItemRequest;
import com.prm.channel.dto.request.CreateSeriesRequest;
import com.prm.channel.dto.request.ReorderSeriesItemsRequest;
import com.prm.channel.dto.request.UpdateSeriesRequest;
import com.prm.channel.dto.response.SeriesDetailResponse;
import com.prm.channel.dto.response.SeriesItemResponse;
import com.prm.channel.dto.response.SeriesResponse;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.Series;
import com.prm.channel.entity.SeriesItem;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.SeriesItemRepository;
import com.prm.channel.repository.SeriesRepository;
import com.prm.channel.service.SeriesService;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SeriesServiceImpl implements SeriesService {

    private final SeriesRepository seriesRepository;
    private final SeriesItemRepository seriesItemRepository;
    private final ChannelRepository channelRepository;
    private final ContentRepository contentRepository;
    private final ArtifactRepository artifactRepository;
    private final UserRepository userRepository;

    @Override
    public SeriesResponse createSeries(String userEmail, CreateSeriesRequest request) {
        User user = getUserByEmail(userEmail);
        Channel channel = getChannelByCreator(user);

        if (seriesRepository.existsByChannelIdAndTitle(channel.getId(), request.getTitle())) {
            throw new AppException(ErrorCode.SERIES_TITLE_EXISTS, "Tên Series đã tồn tại trong kênh của bạn");
        }

        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus().toUpperCase() : "PUBLISHED";

        Series series = Series.builder()
                .channel(channel)
                .title(request.getTitle())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl())
                .status(status)
                .build();

        Series savedSeries = seriesRepository.save(series);

        // Nếu có danh sách video ban đầu
        if (request.getContentIds() != null && !request.getContentIds().isEmpty()) {
            int order = 1;
            String firstCover = null;
            for (Long contentId : request.getContentIds()) {
                Content content = contentRepository.findByIdAndCreatorId(contentId, user.getId())
                        .orElse(null);
                if (content != null && !seriesItemRepository.existsBySeriesIdAndContentId(savedSeries.getId(), content.getId())) {
                    SeriesItem item = SeriesItem.builder()
                            .series(savedSeries)
                            .content(content)
                            .orderNo(order++)
                            .build();
                    seriesItemRepository.save(item);

                    if (firstCover == null) {
                        firstCover = extractCoverUrlFromContent(content.getId());
                    }
                }
            }
            // Nếu chưa có coverUrl thì lấy cover từ video đầu tiên
            if (!StringUtils.hasText(savedSeries.getCoverUrl()) && firstCover != null) {
                savedSeries.setCoverUrl(firstCover);
                savedSeries = seriesRepository.save(savedSeries);
            }
        }

        log.info("Creator '{}' created series '{}' (ID: {})", userEmail, savedSeries.getTitle(), savedSeries.getId());
        return toSeriesResponse(savedSeries);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeriesResponse> getCreatorSeries(String userEmail) {
        User user = getUserByEmail(userEmail);
        Channel channel = getChannelByCreator(user);

        List<Series> list = seriesRepository.findByChannelIdOrderByCreatedAtDesc(channel.getId());
        return list.stream().map(this::toSeriesResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SeriesDetailResponse getSeriesDetail(String userEmail, Long seriesId) {
        User user = getUserByEmail(userEmail);
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!series.getChannel().getCreator().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SERIES_ACCESS_DENIED, "Bạn không có quyền quản lý Series này");
        }

        return toSeriesDetailResponse(series);
    }

    @Override
    public SeriesResponse updateSeries(String userEmail, Long seriesId, UpdateSeriesRequest request) {
        User user = getUserByEmail(userEmail);
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!series.getChannel().getCreator().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SERIES_ACCESS_DENIED, "Bạn không có quyền quản lý Series này");
        }

        if (seriesRepository.existsByChannelIdAndTitleAndIdNot(series.getChannel().getId(), request.getTitle(), seriesId)) {
            throw new AppException(ErrorCode.SERIES_TITLE_EXISTS, "Tên Series này đã bị trùng với một Series khác");
        }

        series.setTitle(request.getTitle());
        series.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getCoverUrl())) {
            series.setCoverUrl(request.getCoverUrl());
        }
        if (StringUtils.hasText(request.getStatus())) {
            series.setStatus(request.getStatus().toUpperCase());
        }

        Series updated = seriesRepository.save(series);
        log.info("Creator '{}' updated series ID {}", userEmail, seriesId);
        return toSeriesResponse(updated);
    }

    @Override
    public void deleteSeries(String userEmail, Long seriesId) {
        User user = getUserByEmail(userEmail);
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!series.getChannel().getCreator().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SERIES_ACCESS_DENIED, "Bạn không có quyền quản lý Series này");
        }

        // Xóa Series sẽ cascade xóa series_items; các video gốc (contents) vẫn giữ nguyên
        seriesRepository.delete(series);
        log.info("Creator '{}' deleted series ID {}", userEmail, seriesId);
    }

    @Override
    public SeriesDetailResponse addSeriesItem(String userEmail, Long seriesId, AddSeriesItemRequest request) {
        User user = getUserByEmail(userEmail);
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!series.getChannel().getCreator().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SERIES_ACCESS_DENIED, "Bạn không có quyền quản lý Series này");
        }

        Content content = contentRepository.findByIdAndCreatorId(request.getContentId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CONTENT_NOT_FOUND, "Không tìm thấy video/podcast trong kênh của bạn"));

        if (seriesItemRepository.existsBySeriesIdAndContentId(seriesId, content.getId())) {
            throw new AppException(ErrorCode.SERIES_ITEM_ALREADY_EXISTS, "Video này đã tồn tại trong Series");
        }

        int maxOrder = seriesItemRepository.findMaxOrderNoBySeriesId(seriesId);
        int targetOrder = (request.getOrderNo() != null && request.getOrderNo() > 0) ? request.getOrderNo() : (maxOrder + 1);

        SeriesItem item = SeriesItem.builder()
                .series(series)
                .content(content)
                .orderNo(targetOrder)
                .build();
        seriesItemRepository.save(item);

        // Tự động gán coverUrl cho Series nếu Series chưa có ảnh bìa
        if (!StringUtils.hasText(series.getCoverUrl())) {
            String cover = extractCoverUrlFromContent(content.getId());
            if (cover != null) {
                series.setCoverUrl(cover);
                seriesRepository.save(series);
            }
        }

        log.info("Added content ID {} to series ID {} at order {}", content.getId(), seriesId, targetOrder);
        return toSeriesDetailResponse(series);
    }

    @Override
    public SeriesDetailResponse removeSeriesItem(String userEmail, Long seriesId, Long contentId) {
        User user = getUserByEmail(userEmail);
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!series.getChannel().getCreator().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SERIES_ACCESS_DENIED, "Bạn không có quyền quản lý Series này");
        }

        seriesItemRepository.deleteBySeriesIdAndContentId(seriesId, contentId);

        // Đánh lại số thứ tự liền mạch cho các tập còn lại
        List<SeriesItem> remaining = seriesItemRepository.findBySeriesIdOrderByOrderNoAsc(seriesId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderNo(i + 1);
            seriesItemRepository.save(remaining.get(i));
        }

        log.info("Removed content ID {} from series ID {}", contentId, seriesId);
        return toSeriesDetailResponse(series);
    }

    @Override
    public SeriesDetailResponse reorderSeriesItems(String userEmail, Long seriesId, ReorderSeriesItemsRequest request) {
        User user = getUserByEmail(userEmail);
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!series.getChannel().getCreator().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SERIES_ACCESS_DENIED, "Bạn không có quyền quản lý Series này");
        }

        List<Long> newOrder = request.getContentIds();
        for (int i = 0; i < newOrder.size(); i++) {
            Long cId = newOrder.get(i);
            Optional<SeriesItem> itemOpt = seriesItemRepository.findBySeriesIdAndContentId(seriesId, cId);
            if (itemOpt.isPresent()) {
                SeriesItem item = itemOpt.get();
                item.setOrderNo(i + 1);
                seriesItemRepository.save(item);
            }
        }

        log.info("Reordered items for series ID {}", seriesId);
        return toSeriesDetailResponse(series);
    }

    @Override
    public void addContentToSeriesDirectly(Long contentId, Long seriesId) {
        if (contentId == null || seriesId == null) return;
        Optional<Series> seriesOpt = seriesRepository.findById(seriesId);
        Optional<Content> contentOpt = contentRepository.findById(contentId);

        if (seriesOpt.isPresent() && contentOpt.isPresent()) {
            Series series = seriesOpt.get();
            Content content = contentOpt.get();
            if (!seriesItemRepository.existsBySeriesIdAndContentId(seriesId, contentId)) {
                int maxOrder = seriesItemRepository.findMaxOrderNoBySeriesId(seriesId);
                SeriesItem item = SeriesItem.builder()
                        .series(series)
                        .content(content)
                        .orderNo(maxOrder + 1)
                        .build();
                seriesItemRepository.save(item);

                if (!StringUtils.hasText(series.getCoverUrl())) {
                    String cover = extractCoverUrlFromContent(contentId);
                    if (cover != null) {
                        series.setCoverUrl(cover);
                        seriesRepository.save(series);
                    }
                }
                log.info("Auto-assigned newly rendered content ID {} to series ID {}", contentId, seriesId);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeriesResponse> getPublicChannelSeries(Long channelId) {
        List<Series> list = seriesRepository.findByChannelIdAndStatusOrderByCreatedAtDesc(channelId, "PUBLISHED");
        return list.stream().map(this::toSeriesResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SeriesDetailResponse getPublicSeriesDetail(Long seriesId) {
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new AppException(ErrorCode.SERIES_NOT_FOUND, "Không tìm thấy Series"));

        if (!"PUBLISHED".equalsIgnoreCase(series.getStatus())) {
            throw new AppException(ErrorCode.SERIES_NOT_FOUND, "Series này hiện đang ở chế độ ẩn hoặc nháp");
        }

        return toSeriesDetailResponse(series);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng với email: " + email));
    }

    private Channel getChannelByCreator(User user) {
        return channelRepository.findByCreatorId(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Bạn cần tạo kênh trước khi quản lý Series"));
    }

    private SeriesResponse toSeriesResponse(Series s) {
        List<SeriesItem> items = seriesItemRepository.findBySeriesIdOrderByOrderNoAsc(s.getId());
        int totalSec = 0;
        for (SeriesItem item : items) {
            totalSec += extractDurationSecondsFromContent(item.getContent().getId());
        }

        return SeriesResponse.builder()
                .id(s.getId())
                .channelId(s.getChannel().getId())
                .channelName(s.getChannel().getName())
                .title(s.getTitle())
                .description(s.getDescription())
                .coverUrl(s.getCoverUrl())
                .status(s.getStatus())
                .itemCount(items.size())
                .totalDurationSeconds(totalSec)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private SeriesDetailResponse toSeriesDetailResponse(Series s) {
        List<SeriesItem> items = seriesItemRepository.findBySeriesIdOrderByOrderNoAsc(s.getId());
        List<SeriesItemResponse> itemResponses = new ArrayList<>();
        int totalSec = 0;

        for (SeriesItem item : items) {
            Content c = item.getContent();
            List<Artifact> artifacts = artifactRepository.findByContentId(c.getId());

            String thumbUrl = null;
            String mediaUrl = null;
            Integer duration = 0;

            for (Artifact a : artifacts) {
                if ("THUMBNAIL".equalsIgnoreCase(a.getType()) || "COVER".equalsIgnoreCase(a.getType())) {
                    if (thumbUrl == null) {
                        thumbUrl = StringUtils.hasText(a.getOptimizedUrl()) ? a.getOptimizedUrl() : a.getFileUrl();
                    }
                } else if ("VIDEO".equalsIgnoreCase(a.getType()) || "AUDIO".equalsIgnoreCase(a.getType())) {
                    if (mediaUrl == null) {
                        mediaUrl = StringUtils.hasText(a.getOptimizedUrl()) ? a.getOptimizedUrl() : a.getFileUrl();
                    }
                    if (a.getDurationSeconds() != null && a.getDurationSeconds() > 0) {
                        duration = a.getDurationSeconds();
                    }
                }
            }

            // Fallback thumbnail nếu không có artifact thumbnail riêng
            if (thumbUrl == null && mediaUrl != null) {
                thumbUrl = mediaUrl;
            }

            totalSec += (duration != null ? duration : 0);

            itemResponses.add(SeriesItemResponse.builder()
                    .id(item.getId())
                    .seriesId(s.getId())
                    .contentId(c.getId())
                    .orderNo(item.getOrderNo())
                    .title(c.getTitle())
                    .description(c.getTextBody())
                    .thumbnailUrl(thumbUrl)
                    .mediaUrl(mediaUrl)
                    .durationSeconds(duration)
                    .isExclusive(c.getIsExclusive())
                    .status(c.getStatus())
                    .createdAt(item.getCreatedAt())
                    .build());
        }

        return SeriesDetailResponse.builder()
                .id(s.getId())
                .channelId(s.getChannel().getId())
                .channelName(s.getChannel().getName())
                .channelAvatarUrl(s.getChannel().getAvatarUrl())
                .title(s.getTitle())
                .description(s.getDescription())
                .coverUrl(s.getCoverUrl())
                .status(s.getStatus())
                .itemCount(itemResponses.size())
                .totalDurationSeconds(totalSec)
                .items(itemResponses)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private int extractDurationSecondsFromContent(Long contentId) {
        List<Artifact> artifacts = artifactRepository.findByContentId(contentId);
        for (Artifact a : artifacts) {
            if (a.getDurationSeconds() != null && a.getDurationSeconds() > 0) {
                return a.getDurationSeconds();
            }
        }
        return 0;
    }

    private String extractCoverUrlFromContent(Long contentId) {
        List<Artifact> artifacts = artifactRepository.findByContentId(contentId);
        for (Artifact a : artifacts) {
            if ("THUMBNAIL".equalsIgnoreCase(a.getType()) || "COVER".equalsIgnoreCase(a.getType())) {
                return StringUtils.hasText(a.getOptimizedUrl()) ? a.getOptimizedUrl() : a.getFileUrl();
            }
        }
        if (!artifacts.isEmpty()) {
            Artifact first = artifacts.get(0);
            return StringUtils.hasText(first.getOptimizedUrl()) ? first.getOptimizedUrl() : first.getFileUrl();
        }
        return null;
    }
}
