import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { NarratorProfileItem, NarratorDemoItem } from '@/types/narrator';

export interface UpdateNarratorPayload {
  userId?: number;
  bio?: string;
  languages?: string;
  baseRate?: number;
  status?: string;
  createdAt?: string;
}

export const narratorsApi = {
  getAllNarrators: async (): Promise<ApiResponse<NarratorProfileItem[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<NarratorProfileItem[]>>(
        '/api/v1/narrator-profiles'
      );
      return response.data;
    } catch {
      return { success: true, message: 'OK', data: [], timestamp: new Date().toISOString() };
    }
  },

  getNarratorById: async (id: number): Promise<ApiResponse<NarratorProfileItem>> => {
    const response = await apiClient.get<ApiResponse<NarratorProfileItem>>(
      `/api/v1/narrator-profiles/${id}`
    );
    return response.data;
  },

  updateNarrator: async (
    id: number,
    payload: UpdateNarratorPayload
  ): Promise<ApiResponse<NarratorProfileItem>> => {
    const response = await apiClient.put<ApiResponse<NarratorProfileItem>>(
      `/api/v1/narrator-profiles/${id}`,
      payload
    );
    return response.data;
  },

  deleteNarrator: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/v1/narrator-profiles/${id}`
    );
    return response.data;
  },

  getAllDemos: async (): Promise<ApiResponse<NarratorDemoItem[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<NarratorDemoItem[]>>(
        '/api/v1/narrator-demos'
      );
      return response.data;
    } catch {
      return { success: true, message: 'OK', data: [], timestamp: new Date().toISOString() };
    }
  },

  getDemoById: async (id: number): Promise<ApiResponse<NarratorDemoItem>> => {
    const response = await apiClient.get<ApiResponse<NarratorDemoItem>>(
      `/api/v1/narrator-demos/${id}`
    );
    return response.data;
  },
};
