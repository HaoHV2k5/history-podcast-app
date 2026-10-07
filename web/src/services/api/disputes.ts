import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { DisputeItem } from '@/types/dispute';

export const disputesApi = {
  getAllDisputes: async (): Promise<ApiResponse<PageResponse<DisputeItem> | DisputeItem[]>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<DisputeItem> | DisputeItem[]>>(
      '/api/v1/disputes'
    );
    return response.data;
  },

  getDisputeById: async (id: number): Promise<ApiResponse<DisputeItem>> => {
    const response = await apiClient.get<ApiResponse<DisputeItem>>(
      `/api/v1/disputes/${id}`
    );
    return response.data;
  },
};
