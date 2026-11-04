import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  AuditLogItem,
  RefreshTokenAuditItem,
  SystemConfigAuditItem,
} from '@/types/audit';

export const auditApi = {
  /**
   * Lấy toàn bộ danh sách nhật ký hệ thống từ bảng audit_logs (GET /api/v1/audit-logs)
   * Giữ nguyên tính chất chỉ đọc (Read-Only) trên giao diện Quản trị.
   */
  getAllAuditLogs: async (): Promise<ApiResponse<AuditLogItem[]>> => {
    const response = await apiClient.get<ApiResponse<AuditLogItem[]>>(
      '/api/v1/audit-logs'
    );
    return response.data;
  },

  /**
   * Lấy chi tiết một bản ghi nhật ký theo mã số từ bảng audit_logs (GET /api/v1/audit-logs/{id})
   */
  getAuditLogById: async (id: number): Promise<ApiResponse<AuditLogItem>> => {
    const response = await apiClient.get<ApiResponse<AuditLogItem>>(
      `/api/v1/audit-logs/${id}`
    );
    return response.data;
  },

  /**
   * Lấy danh sách phiên xác thực từ bảng refresh_tokens (GET /api/v1/refresh-tokens)
   * Phục vụ đối soát lịch sử Đăng nhập (issuedAt) và Đăng xuất / Thu hồi phiên (revokedAt) thực tế.
   */
  getRefreshTokens: async (): Promise<ApiResponse<RefreshTokenAuditItem[]>> => {
    const response = await apiClient.get<ApiResponse<RefreshTokenAuditItem[]>>(
      '/api/v1/refresh-tokens'
    );
    return response.data;
  },

  /**
   * Lấy danh sách cấu hình tham số hệ thống từ bảng system_configs (GET /api/v1/system-configs)
   * Phục vụ đối soát lịch sử cập nhật cấu hình vận hành của Quản trị viên.
   */
  getSystemConfigs: async (): Promise<ApiResponse<SystemConfigAuditItem[]>> => {
    const response = await apiClient.get<ApiResponse<SystemConfigAuditItem[]>>(
      '/api/v1/system-configs'
    );
    return response.data;
  },
};
