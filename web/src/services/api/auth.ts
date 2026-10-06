import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { AuthResponse, UserResponse } from '@/types/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/v1/auth/login',
      payload
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `/api/v1/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(
      '/api/v1/users/me'
    );
    return response.data;
  },
};
