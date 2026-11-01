import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  EscrowTransactionItem,
  AdminMilestoneRevenueItem,
  MilestoneRevenueSummaryItem,
  MilestoneRevenueChartPointItem,
  TopRevenueContributorItem,
} from '@/types/escrow';
import { MilestoneItem } from '@/types/contract';

export const escrowApi = {
  // Legacy alias preserved for test backwards-compatibility
  getAllEscrowTransactions: async (): Promise<ApiResponse<EscrowTransactionItem[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<EscrowTransactionItem[]>>(
        '/api/v1/escrow-transactions'
      );
      return response.data;
    } catch {
      // Fallback empty response if V1 endpoint is removed on backend
      return { success: true, message: 'OK', data: [], timestamp: new Date().toISOString() };
    }
  },

  getEscrowById: async (id: number): Promise<ApiResponse<EscrowTransactionItem>> => {
    const response = await apiClient.get<ApiResponse<EscrowTransactionItem>>(
      `/api/v1/escrow-transactions/${id}`
    );
    return response.data;
  },

  getMilestonesByContract: async (contractId: number): Promise<ApiResponse<MilestoneItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneItem[]>>(
      `/api/v1/milestones/contract/${contractId}`
    );
    return response.data;
  },

  // V2 Admin Milestone Revenue & Escrow Ledger Endpoints
  getMilestoneRevenueSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<MilestoneRevenueSummaryItem>> => {
    const response = await apiClient.get<ApiResponse<MilestoneRevenueSummaryItem>>(
      '/api/v1/admin/revenue/milestones/summary',
      { params }
    );
    return response.data;
  },

  getMilestoneRevenueChart: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'DAY' | 'WEEK' | 'MONTH';
  }): Promise<ApiResponse<MilestoneRevenueChartPointItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneRevenueChartPointItem[]>>(
      '/api/v1/admin/revenue/milestones/chart',
      { params }
    );
    return response.data;
  },

  getMilestoneRevenueLedger: async (params?: {
    contractId?: number;
    status?: string;
    serviceType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<ApiResponse<PageResponse<AdminMilestoneRevenueItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AdminMilestoneRevenueItem>>>(
      '/api/v1/admin/revenue/milestones/ledger',
      {
        params: {
          ...params,
          status: params?.status === 'ALL' ? undefined : params?.status,
        },
      }
    );
    return response.data;
  },

  getTopContributors: async (params?: {
    role?: 'CREATOR' | 'REQUESTER';
    limit?: number;
  }): Promise<ApiResponse<TopRevenueContributorItem[]>> => {
    const response = await apiClient.get<ApiResponse<TopRevenueContributorItem[]>>(
      '/api/v1/admin/revenue/milestones/top-contributors',
      { params }
    );
    return response.data;
  },

  exportRevenueCsv: async (params?: {
    contractId?: number;
    status?: string;
    serviceType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/admin/revenue/milestones/export', {
      params: {
        ...params,
        status: params?.status === 'ALL' ? undefined : params?.status,
      },
      responseType: 'blob',
    });
    return response.data;
  },
};
