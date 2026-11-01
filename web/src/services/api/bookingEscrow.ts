import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { BookingEscrowPolicy, BookingEscrowConfigRequest } from '@/types/bookingEscrow';

export const bookingEscrowApi = {
  getPublicPolicy: async (): Promise<ApiResponse<BookingEscrowPolicy>> => {
    const response = await apiClient.get<ApiResponse<BookingEscrowPolicy>>(
      '/api/v1/booking-escrow/policy'
    );
    return response.data;
  },

  getAdminConfig: async (): Promise<ApiResponse<BookingEscrowPolicy>> => {
    const response = await apiClient.get<ApiResponse<BookingEscrowPolicy>>(
      '/api/v1/admin/booking-escrow/config'
    );
    return response.data;
  },

  updateAdminConfig: async (
    payload: BookingEscrowConfigRequest
  ): Promise<ApiResponse<BookingEscrowPolicy>> => {
    const response = await apiClient.put<ApiResponse<BookingEscrowPolicy>>(
      '/api/v1/admin/booking-escrow/config',
      payload
    );
    return response.data;
  },

  resetAdminConfig: async (): Promise<ApiResponse<BookingEscrowPolicy>> => {
    const response = await apiClient.post<ApiResponse<BookingEscrowPolicy>>(
      '/api/v1/admin/booking-escrow/config/reset'
    );
    return response.data;
  },
};
