import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { WithdrawalItem, RejectWithdrawalPayload } from '@/types/withdrawal';

export const withdrawalsApi = {
  getAllWithdrawals: async (
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<WithdrawalItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<WithdrawalItem>>>(
      '/api/v1/withdrawals/admin',
      { params: { page, size } }
    );
    return response.data;
  },

  getWithdrawalDetail: async (id: number): Promise<WithdrawalItem | null> => {
    const response = await apiClient.get<ApiResponse<PageResponse<WithdrawalItem>>>(
      '/api/v1/withdrawals/admin',
      { params: { page: 0, size: 100 } }
    );
    const items = response.data.data?.items || response.data.data?.content || [];
    const found = items.find((w) => w.id === id);
    return found || null;
  },

  // Mandatory Correction 1 mapping: Approve Request transitions PENDING -> PROCESSING
  approveRequest: async (id: number): Promise<ApiResponse<WithdrawalItem>> => {
    const response = await apiClient.patch<ApiResponse<WithdrawalItem>>(
      `/api/v1/withdrawals/admin/${id}/process`
    );
    return response.data;
  },

  // Mandatory Correction 1 mapping: Reject Request transitions PENDING -> REJECTED with refund
  rejectRequest: async (
    id: number,
    payload: RejectWithdrawalPayload
  ): Promise<ApiResponse<WithdrawalItem>> => {
    const response = await apiClient.patch<ApiResponse<WithdrawalItem>>(
      `/api/v1/withdrawals/admin/${id}/reject`,
      payload
    );
    return response.data;
  },
};
