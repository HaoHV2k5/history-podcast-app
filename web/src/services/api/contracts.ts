import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { ContractItem, MilestoneItem } from '@/types/contract';

export const contractsApi = {
  getAllContracts: async (): Promise<ApiResponse<PageResponse<ContractItem> | ContractItem[]>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ContractItem>>>(
      '/api/v1/contracts/me'
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
};
