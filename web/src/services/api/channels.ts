import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  ChannelItem,
  CreateChannelRequest,
  UpdateChannelRequest,
} from '@/types/channel';

export const channelsApi = {
  // Creator Channel endpoints
  getMyChannel: async (): Promise<ApiResponse<ChannelItem>> => {
    const response = await apiClient.get<ApiResponse<ChannelItem>>(
      '/api/v1/channels/me'
    );
    return response.data;
  },

  createChannel: async (
    payload: CreateChannelRequest
  ): Promise<ApiResponse<ChannelItem>> => {
    const response = await apiClient.post<ApiResponse<ChannelItem>>(
      '/api/v1/channels',
      payload
    );
    return response.data;
  },

  updateChannel: async (
    id: number,
    payload: UpdateChannelRequest
  ): Promise<ApiResponse<ChannelItem>> => {
    const response = await apiClient.put<ApiResponse<ChannelItem>>(
      `/api/v1/channels/${id}`,
      payload
    );
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<ChannelItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<ChannelItem>>(
      '/api/v1/channels/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  uploadCover: async (file: File): Promise<ApiResponse<ChannelItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<ChannelItem>>(
      '/api/v1/channels/me/cover',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Public / Admin Channel endpoints
  getAllChannels: async (
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<ChannelItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ChannelItem>>>(
      '/api/v1/channels',
      { params: { page, size } }
    );
    return response.data;
  },

  getChannelById: async (id: number): Promise<ApiResponse<ChannelItem>> => {
    const response = await apiClient.get<ApiResponse<ChannelItem>>(
      `/api/v1/channels/${id}`
    );
    return response.data;
  },
};

