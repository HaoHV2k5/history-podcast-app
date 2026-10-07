import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { MembershipPaymentItem } from '@/types/membership';

export const membershipApi = {
  getAllPayments: async (): Promise<ApiResponse<MembershipPaymentItem[]>> => {
    const response = await apiClient.get<ApiResponse<MembershipPaymentItem[]>>(
      '/api/v1/membership-payments'
    );
    return response.data;
  },

  getPaymentById: async (id: number): Promise<ApiResponse<MembershipPaymentItem>> => {
    const response = await apiClient.get<ApiResponse<MembershipPaymentItem>>(
      `/api/v1/membership-payments/${id}`
    );
    return response.data;
  },
};
