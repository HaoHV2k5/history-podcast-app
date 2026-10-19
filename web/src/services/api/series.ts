import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  SeriesItem,
  SeriesDetail,
  CreateSeriesRequest,
  UpdateSeriesRequest,
  AddSeriesItemRequest,
  ReorderSeriesItemsRequest,
} from '@/types/series';

export const seriesApi = {
  // Public Series endpoints
  getPublicChannelSeries: async (channelId: number): Promise<ApiResponse<SeriesItem[]>> => {
    const response = await apiClient.get<ApiResponse<SeriesItem[]>>(
      `/api/v1/channels/${channelId}/series`
    );
    return response.data;
  },

  getPublicSeriesDetail: async (seriesId: number): Promise<ApiResponse<SeriesDetail>> => {
    const response = await apiClient.get<ApiResponse<SeriesDetail>>(
      `/api/v1/series/${seriesId}`
    );
    return response.data;
  },

  // Creator Series endpoints
  getMySeries: async (): Promise<ApiResponse<SeriesItem[]>> => {
    const response = await apiClient.get<ApiResponse<SeriesItem[]>>(
      '/api/v1/creator/series'
    );
    return response.data;
  },

  getSeriesDetail: async (seriesId: number): Promise<ApiResponse<SeriesDetail>> => {
    const response = await apiClient.get<ApiResponse<SeriesDetail>>(
      `/api/v1/creator/series/${seriesId}`
    );
    return response.data;
  },

  createSeries: async (request: CreateSeriesRequest): Promise<ApiResponse<SeriesItem>> => {
    const response = await apiClient.post<ApiResponse<SeriesItem>>(
      '/api/v1/creator/series',
      request
    );
    return response.data;
  },

  updateSeries: async (
    seriesId: number,
    request: UpdateSeriesRequest
  ): Promise<ApiResponse<SeriesItem>> => {
    const response = await apiClient.put<ApiResponse<SeriesItem>>(
      `/api/v1/creator/series/${seriesId}`,
      request
    );
    return response.data;
  },

  deleteSeries: async (seriesId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/v1/creator/series/${seriesId}`
    );
    return response.data;
  },

  addSeriesItem: async (
    seriesId: number,
    request: AddSeriesItemRequest
  ): Promise<ApiResponse<SeriesDetail>> => {
    const response = await apiClient.post<ApiResponse<SeriesDetail>>(
      `/api/v1/creator/series/${seriesId}/items`,
      request
    );
    return response.data;
  },

  removeSeriesItem: async (
    seriesId: number,
    contentId: number
  ): Promise<ApiResponse<SeriesDetail>> => {
    const response = await apiClient.delete<ApiResponse<SeriesDetail>>(
      `/api/v1/creator/series/${seriesId}/items/${contentId}`
    );
    return response.data;
  },

  reorderSeriesItems: async (
    seriesId: number,
    request: ReorderSeriesItemsRequest
  ): Promise<ApiResponse<SeriesDetail>> => {
    const response = await apiClient.put<ApiResponse<SeriesDetail>>(
      `/api/v1/creator/series/${seriesId}/reorder`,
      request
    );
    return response.data;
  },
};
