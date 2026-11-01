import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { MilestoneReviewItem } from '@/types/contract';

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  createMilestoneReview: async (
    milestoneId: number,
    payload: CreateReviewPayload
  ): Promise<ApiResponse<MilestoneReviewItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneReviewItem>>(
      `/api/v1/milestones/${milestoneId}/reviews`,
      payload
    );
    return response.data;
  },

  getReviewsByMilestone: async (
    milestoneId: number
  ): Promise<ApiResponse<MilestoneReviewItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneReviewItem[]>>(
      `/api/v1/milestones/${milestoneId}/reviews`
    );
    return response.data;
  },

  getReviewsByContract: async (
    contractId: number
  ): Promise<ApiResponse<MilestoneReviewItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneReviewItem[]>>(
      `/api/v1/contracts/${contractId}/milestone-reviews`
    );
    return response.data;
  },

  createContractReview: async (
    contractId: number,
    payload: CreateReviewPayload
  ): Promise<ApiResponse<MilestoneReviewItem>> => {
    const response = await apiClient.post<ApiResponse<MilestoneReviewItem>>(
      `/api/v1/reviews/contract/${contractId}`,
      payload
    );
    return response.data;
  },
};
