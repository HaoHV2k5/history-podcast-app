import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { NarratorProfileItem, NarratorDemoItem } from '@/types/narrator';

export const narratorsApi = {
  getAllNarrators: async (): Promise<ApiResponse<NarratorProfileItem[]>> => {
    const response = await apiClient.get<ApiResponse<NarratorProfileItem[]>>(
      '/api/v1/narrator-profiles'
    );
    return response.data;
  },

  getAllDemos: async (): Promise<ApiResponse<NarratorDemoItem[]>> => {
    const response = await apiClient.get<ApiResponse<NarratorDemoItem[]>>(
      '/api/v1/narrator-demos'
    );
    return response.data;
  },
};
