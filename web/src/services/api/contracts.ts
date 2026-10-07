import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { ContractItem } from '@/types/contract';

export const contractsApi = {
  getAllContracts: async (): Promise<ApiResponse<PageResponse<ContractItem> | ContractItem[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<ContractItem>>>(
        '/api/v1/contracts/me'
      );
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Success',
        data: [] as ContractItem[],
        timestamp: new Date().toISOString(),
      };
    }
  },

  getContractById: async (id: number): Promise<ApiResponse<ContractItem>> => {
    const response = await apiClient.get<ApiResponse<ContractItem>>(
      `/api/v1/contracts/${id}`
    );
    return response.data;
  },
};
