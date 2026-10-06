import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import { UserResponse } from '@/types/auth';

export interface UserQueryParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export const usersApi = {
  searchUsers: async (
    params: UserQueryParams = {}
  ): Promise<ApiResponse<PageResponse<UserResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      '/api/v1/admin/users',
      { params }
    );
    return response.data;
  },

  getUserById: async (id: number): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(
      `/api/v1/admin/users/${id}`
    );
    return response.data;
  },

  updateStatus: async (
    id: number,
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'
  ): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      `/api/v1/admin/users/${id}/status`,
      { status }
    );
    return response.data;
  },

  updateRole: async (
    id: number,
    role: 'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER'
  ): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      `/api/v1/admin/users/${id}/role`,
      { role }
    );
    return response.data;
  },

  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/v1/admin/users/${id}`
    );
    return response.data;
  },
};
