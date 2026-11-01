import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  DisputeItem,
  ResolveDisputePayload,
  OpenDisputePayload,
  CounterEvidencePayload,
} from '@/types/dispute';

export const disputesApi = {
  getAllDisputes: async (
    status?: string
  ): Promise<ApiResponse<PageResponse<DisputeItem> | DisputeItem[]>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<DisputeItem> | DisputeItem[]>>(
      '/api/v1/disputes',
      { params: status && status !== 'ALL' ? { status } : undefined }
    );
    return response.data;
  },

  getDisputeById: async (id: number): Promise<ApiResponse<DisputeItem>> => {
    const response = await apiClient.get<ApiResponse<DisputeItem>>(
      `/api/v1/disputes/${id}`
    );
    return response.data;
  },

  getDisputesByContract: async (contractId: number): Promise<ApiResponse<DisputeItem[]>> => {
    const response = await apiClient.get<ApiResponse<DisputeItem[]>>(
      `/api/v1/disputes/contract/${contractId}`
    );
    return response.data;
  },

  openDispute: async (payload: OpenDisputePayload): Promise<ApiResponse<DisputeItem>> => {
    const response = await apiClient.post<ApiResponse<DisputeItem>>(
      '/api/v1/disputes',
      payload
    );
    return response.data;
  },

  submitCounterEvidence: async (
    id: number,
    payload: CounterEvidencePayload
  ): Promise<ApiResponse<DisputeItem>> => {
    const response = await apiClient.post<ApiResponse<DisputeItem>>(
      `/api/v1/disputes/${id}/counter-evidence`,
      payload
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
