import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { DisputeItem, ResolveDisputePayload } from '@/types/dispute';

export const disputesApi = {
  getAllDisputes: async (
    status?: string
  ): Promise<ApiResponse<PageResponse<DisputeItem> | DisputeItem[]>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<DisputeItem> | DisputeItem[]>>(
      '/api/v1/disputes',
      { params: status ? { status } : undefined }
    );
    return response.data;
  },

  getDisputeById: async (id: number): Promise<ApiResponse<DisputeItem>> => {
    const response = await apiClient.get<ApiResponse<DisputeItem>>(
      `/api/v1/disputes/${id}`
    );
    return response.data;
  },

  resolveDispute: async (
    id: number,
    payload: ResolveDisputePayload
  ): Promise<ApiResponse<DisputeItem>> => {
    const response = await apiClient.post<ApiResponse<DisputeItem>>(
      `/api/v1/disputes/${id}/resolve`,
      payload
    );
    return response.data;
  },
};
