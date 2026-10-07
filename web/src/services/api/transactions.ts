import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { WalletTransactionItem } from '@/types/transaction';

export const transactionsApi = {
  getAllTransactions: async (): Promise<ApiResponse<WalletTransactionItem[]>> => {
    const response = await apiClient.get<ApiResponse<WalletTransactionItem[]>>(
      '/api/v1/wallet-transactions'
    );
    return response.data;
  },

  getTransactionById: async (id: number): Promise<ApiResponse<WalletTransactionItem>> => {
    const response = await apiClient.get<ApiResponse<WalletTransactionItem>>(
      `/api/v1/wallet-transactions/${id}`
    );
    return response.data;
  },
};
