import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  AdminModerationItem,
  AdminModerationDecisionPayload,
  AiShieldPolicyConfig,
} from '@/types/moderation';

export interface ModerationQueryParams {
  decision?: string;
  tier?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export const moderationApi = {
  getReviews: async (
    params: ModerationQueryParams = {}
  ): Promise<ApiResponse<PageResponse<AdminModerationItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AdminModerationItem>>>(
      '/api/v1/admin/moderation/reviews',
      { params }
    );
    return response.data;
  },

  getReviewDetail: async (id: number): Promise<ApiResponse<AdminModerationItem>> => {
    const response = await apiClient.get<ApiResponse<AdminModerationItem>>(
      `/api/v1/admin/moderation/reviews/${id}`
    );
    return response.data;
  },

  submitDecision: async (
    id: number,
    payload: AdminModerationDecisionPayload
  ): Promise<ApiResponse<AdminModerationItem>> => {
    const response = await apiClient.post<ApiResponse<AdminModerationItem>>(
      `/api/v1/admin/moderation/reviews/${id}/decision`,
      payload
    );
    return response.data;
  },

  getPolicyConfigs: async (): Promise<ApiResponse<AiShieldPolicyConfig[]>> => {
    const response = await apiClient.get<ApiResponse<AiShieldPolicyConfig[]>>(
      '/api/v1/admin/moderation/policy-configs'
    );
    return response.data;
  },

  updatePolicyConfig: async (
    tier: string,
    payload: Partial<AiShieldPolicyConfig>
  ): Promise<ApiResponse<AiShieldPolicyConfig>> => {
    const response = await apiClient.put<ApiResponse<AiShieldPolicyConfig>>(
      `/api/v1/admin/moderation/policy-configs/${tier}`,
      payload
    );
    return response.data;
  },
};
