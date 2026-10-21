import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { EscrowTransactionItem, AdminMilestoneRevenueItem } from '@/types/escrow';
import { MilestoneItem } from '@/types/contract';

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

  getMilestonesByContract: async (contractId: number): Promise<ApiResponse<MilestoneItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneItem[]>>(
      `/api/v1/milestones/contract/${contractId}`
    );
    return response.data;
  },

  getMilestoneRevenueLedger: async (params?: {
    contractId?: number;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<AdminMilestoneRevenueItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AdminMilestoneRevenueItem>>>(
      '/api/v1/admin/revenue/milestones/ledger',
      { params }
    );
    return response.data;
  },
};
