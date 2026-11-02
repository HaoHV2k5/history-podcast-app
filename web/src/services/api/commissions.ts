import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { CommissionItem, CreateCommissionPayload, RejectCommissionPayload } from '@/types/commission';

export interface CommissionFilterParams {
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const commissionsApi = {
  create: async (data: CreateCommissionPayload): Promise<ApiResponse<CommissionItem>> => {
    const response = await apiClient.post<ApiResponse<CommissionItem>>('/api/v1/commissions', data);
    return response.data;
  },

  getMySentRequests: async (
    status?: string,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PageResponse<CommissionItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<CommissionItem>>>(
      '/api/v1/commissions/my-sent',
      {
        params: {
          ...(status && status !== 'ALL' ? { status } : {}),
          ...params,
        },
      }
    );
    return response.data;
  },

  getMyReceivedRequests: async (
    status?: string,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PageResponse<CommissionItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<CommissionItem>>>(
      '/api/v1/commissions/my-received',
      {
        params: {
          ...(status && status !== 'ALL' ? { status } : {}),
          ...params,
        },
      }
    );
    return response.data;
  },

  getMyCommissions: async (
    status?: string,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PageResponse<CommissionItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<CommissionItem>>>(
      '/api/v1/commissions/me',
      {
        params: {
          ...(status && status !== 'ALL' ? { status } : {}),
          ...params,
        },
      }
    );
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<CommissionItem>> => {
    const response = await apiClient.get<ApiResponse<CommissionItem>>(`/api/v1/commissions/${id}`);
    return response.data;
  },

  acceptCommission: async (id: number): Promise<ApiResponse<CommissionItem>> => {
    const response = await apiClient.post<ApiResponse<CommissionItem>>(
      `/api/v1/commissions/${id}/accept`
    );
    return response.data;
  },

  rejectCommission: async (
    id: number,
    payload: RejectCommissionPayload
  ): Promise<ApiResponse<CommissionItem>> => {
    const response = await apiClient.post<ApiResponse<CommissionItem>>(
      `/api/v1/commissions/${id}/reject`,
      payload
    );
    return response.data;
  },

  cancelCommission: async (id: number): Promise<ApiResponse<CommissionItem>> => {
    const response = await apiClient.post<ApiResponse<CommissionItem>>(
      `/api/v1/commissions/${id}/cancel`
    );
    return response.data;
  },
};
