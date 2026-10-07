import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { ChannelItem } from '@/types/channel';

export const channelsApi = {
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
