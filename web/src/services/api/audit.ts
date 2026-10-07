import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { AuditLogItem } from '@/types/audit';

export const auditApi = {
  getAllAuditLogs: async (): Promise<ApiResponse<AuditLogItem[]>> => {
    const response = await apiClient.get<ApiResponse<AuditLogItem[]>>(
      '/api/v1/audit-logs'
    );
    return response.data;
  },

  getAuditLogById: async (id: number): Promise<ApiResponse<AuditLogItem>> => {
    const response = await apiClient.get<ApiResponse<AuditLogItem>>(
      `/api/v1/audit-logs/${id}`
    );
    return response.data;
  },
};
