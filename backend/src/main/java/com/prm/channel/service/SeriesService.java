package com.prm.channel.service;

import com.prm.channel.dto.request.AddSeriesItemRequest;
import com.prm.channel.dto.request.CreateSeriesRequest;
import com.prm.channel.dto.request.ReorderSeriesItemsRequest;
import com.prm.channel.dto.request.UpdateSeriesRequest;
import com.prm.channel.dto.response.SeriesDetailResponse;
import com.prm.channel.dto.response.SeriesResponse;

import java.util.List;

public interface SeriesService {

    SeriesResponse createSeries(String userEmail, CreateSeriesRequest request);

    List<SeriesResponse> getCreatorSeries(String userEmail);

    SeriesDetailResponse getSeriesDetail(String userEmail, Long seriesId);

    SeriesResponse updateSeries(String userEmail, Long seriesId, UpdateSeriesRequest request);

    void deleteSeries(String userEmail, Long seriesId);

    SeriesDetailResponse addSeriesItem(String userEmail, Long seriesId, AddSeriesItemRequest request);

    SeriesDetailResponse removeSeriesItem(String userEmail, Long seriesId, Long contentId);

    SeriesDetailResponse reorderSeriesItems(String userEmail, Long seriesId, ReorderSeriesItemsRequest request);

    void addContentToSeriesDirectly(Long contentId, Long seriesId);

    List<SeriesResponse> getPublicChannelSeries(Long channelId);

    SeriesDetailResponse getPublicSeriesDetail(Long seriesId);
}
