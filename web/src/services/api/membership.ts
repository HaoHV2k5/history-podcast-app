import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  MembershipPaymentItem,
  MembershipPlanItem,
  MembershipPlanRequest,
} from '@/types/membership';

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

  getChannelPlan: async (channelId: number): Promise<ApiResponse<MembershipPlanItem>> => {
    const response = await apiClient.get<ApiResponse<MembershipPlanItem>>(
      `/api/v1/channels/${channelId}/memberships/membership-plans`
    );
    return response.data;
  },

  upsertChannelPlan: async (
    channelId: number,
    payload: MembershipPlanRequest
  ): Promise<ApiResponse<MembershipPlanItem>> => {
    const response = await apiClient.post<ApiResponse<MembershipPlanItem>>(
      `/api/v1/channels/${channelId}/memberships/membership-plans`,
      payload
    );
    return response.data;
  },
};

