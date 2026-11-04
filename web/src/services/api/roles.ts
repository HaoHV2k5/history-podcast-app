import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { RoleItem, RoleRequestPayload } from '@/types/role';

export const rolesApi = {
  getAllRoles: async (): Promise<ApiResponse<RoleItem[]>> => {
    const response = await apiClient.get<ApiResponse<RoleItem[]>>(
      '/api/v1/roles'
    );
    return response.data;
  },

  getRoleById: async (id: number): Promise<ApiResponse<RoleItem>> => {
    const response = await apiClient.get<ApiResponse<RoleItem>>(
      `/api/v1/roles/${id}`
    );
    return response.data;
  },

  createRole: async (
    payload: RoleRequestPayload
  ): Promise<ApiResponse<RoleItem>> => {
    const response = await apiClient.post<ApiResponse<RoleItem>>(
      '/api/v1/roles',
      payload
    );
    return response.data;
  },

  updateRole: async (
    id: number,
    payload: RoleRequestPayload
  ): Promise<ApiResponse<RoleItem>> => {
    const response = await apiClient.put<ApiResponse<RoleItem>>(
      `/api/v1/roles/${id}`,
      payload
    );
    return response.data;
  },

  deleteRole: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/v1/roles/${id}`
    );
    return response.data;
  },
};
