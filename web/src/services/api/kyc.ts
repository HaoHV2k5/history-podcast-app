import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { KycProfile, UpdateKycStatusPayload, KycQueryParams } from '@/types/kyc';

export const kycApi = {
  getKycProfiles: async (
    params: KycQueryParams = {}
  ): Promise<ApiResponse<PageResponse<KycProfile>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<KycProfile>>>(
      '/api/v1/kyc-profiles',
      { params }
    );
    return response.data;
  },

  getKycDetail: async (id: number): Promise<KycProfile | null> => {
    // Backend endpoint /api/v1/kyc-profiles does not have a dedicated /admin/kyc-profiles/{id}
    // We fetch list and find by ID, or if backend supports it we query directly.
    const response = await apiClient.get<ApiResponse<PageResponse<KycProfile>>>(
      '/api/v1/kyc-profiles',
      { params: { page: 0, size: 100 } }
    );
    const items = response.data.data?.items || response.data.data?.content || [];
    const found = items.find((p) => p.id === id);
    return found || null;
  },

  updateKycStatus: async (
    id: number,
    payload: UpdateKycStatusPayload
  ): Promise<ApiResponse<KycProfile>> => {
    const response = await apiClient.patch<ApiResponse<KycProfile>>(
      `/api/v1/kyc-profiles/${id}/status`,
      payload
    );
    return response.data;
  },
};
