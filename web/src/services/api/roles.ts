import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { RoleItem } from '@/types/role';

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
};
