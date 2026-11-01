import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  ContractItem,
  MilestoneItem,
  CreateContractPayload,
  UpdateContractPayload,
  MyMilestoneFinancialResponse,
} from '@/types/contract';

export const contractsApi = {
  getAllContracts: async (
    status?: string,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PageResponse<ContractItem> | ContractItem[]>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ContractItem>>>(
      '/api/v1/contracts/me',
      {
        params: {
          ...(status && status !== 'ALL' ? { status } : {}),
          ...params,
        },
      }
    );
    return response.data;
  },

  getContractById: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.get<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}`
    );
    return response.data;
  },

  getMilestonesByContractId: async (contractId: number): Promise<ApiResponse<MilestoneItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneItem[]>>(
      `/api/v1/milestones/contract/${contractId}`
    );
    return response.data;
  },

  createContract: async (payload: CreateContractPayload): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.post<ApiResponse<ContractItem>>(
      '/api/v1/contracts',
      payload
    );
    return response.data;
  },

  updatePendingContract: async (
    id: number,
    payload: UpdateContractPayload
  ): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.put<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}`,
      payload
    );
    return response.data;
  },

  acceptContract: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.post<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}/accept`
    );
    return response.data;
  },

  rejectContract: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.post<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}/reject`
    );
    return response.data;
  },

  cancelContract: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.post<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}/cancel`
    );
    return response.data;
  },

  getMyMilestones: async (
    status?: string,
    contractId?: number,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PageResponse<MilestoneItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<MilestoneItem>>>(
      '/api/v1/contracts/my-milestones',
      {
        params: {
          ...(status && status !== 'ALL' ? { status } : {}),
          ...(contractId ? { contractId } : {}),
          ...params,
        },
      }
    );
    return response.data;
  },

  getMyMilestoneFinancials: async (): Promise<ApiResponse<MyMilestoneFinancialResponse>> => {
    const response = await apiClient.get<ApiResponse<MyMilestoneFinancialResponse>>(
      '/api/v1/contracts/me/milestone-financials'
    );
    return response.data;
  },
};
