import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { ContractItem } from '@/types/contract';

export const contractsApi = {
  getAllContracts: async (): Promise<ApiResponse<ContractItem[]>> => {
    const response = await apiClient.get<ApiResponse<ContractItem[]>>(
      '/api/v1/contracts'
    );
    return response.data;
  },

  getContractById: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.get<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}`
    );
    return response.data;
  },
};
