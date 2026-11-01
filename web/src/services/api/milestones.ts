import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { MilestoneItem, MilestoneItemPayload, ContractItem } from '@/types/contract';

export const milestonesApi = {
  getMilestoneById: async (id: number): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.get<ApiResponse<MilestoneItem>>(`/api/v1/milestones/${id}`);
    return response.data;
  },

  getMilestonesByContractId: async (contractId: number): Promise<ApiResponse<MilestoneItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneItem[]>>(
      `/api/v1/milestones/contract/${contractId}`
    );
    return response.data;
  },

  updateMilestone: async (
    id: number,
    payload: MilestoneItemPayload
  ): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.put<ApiResponse<MilestoneItem>>(
      `/api/v1/milestones/${id}`,
      payload
    );
    return response.data;
  },

  deleteMilestone: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.delete<ApiResponse<ContractItem>>(`/api/v1/milestones/${id}`);
    return response.data;
  },

  fundMilestone: async (id: number): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneItem>>(
      `/api/v1/milestones/${id}/fund`
    );
    return response.data;
  },

  submitDeliverable: async (
    id: number,
    payload: { content?: string; fileUrl?: string }
  ): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneItem>>(
      `/api/v1/milestones/${id}/submit`,
      payload
    );
    return response.data;
  },

  requestRevision: async (
    id: number,
    payload: { note: string }
  ): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneItem>>(
      `/api/v1/milestones/${id}/request-revision`,
      payload
    );
    return response.data;
  },

  approveMilestone: async (id: number): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneItem>>(
      `/api/v1/milestones/${id}/approve`
    );
    return response.data;
  },

  cancelOverdueMilestone: async (id: number): Promise<ApiResponse<MilestoneItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneItem>>(
      `/api/v1/milestones/${id}/cancel-overdue`
    );
    return response.data;
  },
};
