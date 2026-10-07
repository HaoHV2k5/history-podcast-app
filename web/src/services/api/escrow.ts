import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { EscrowTransactionItem } from '@/types/escrow';

export const escrowApi = {
  getAllEscrowTransactions: async (): Promise<ApiResponse<EscrowTransactionItem[]>> => {
    const response = await apiClient.get<ApiResponse<EscrowTransactionItem[]>>(
      '/api/v1/escrow-transactions'
    );
    return response.data;
  },

  getEscrowById: async (id: number): Promise<ApiResponse<EscrowTransactionItem>> => {
    const response = await apiClient.get<ApiResponse<EscrowTransactionItem>>(
      `/api/v1/escrow-transactions/${id}`
    );
    return response.data;
  },
};
