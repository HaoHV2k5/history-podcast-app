import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { MilestoneDeliverableItem } from '@/types/deliverable';

export const deliverablesApi = {
  uploadDeliverable: async (
    milestoneId: number,
    file: File,
    title?: string,
    description?: string
  ): Promise<ApiResponse<MilestoneDeliverableItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const response = await apiClient.post<ApiResponse<MilestoneDeliverableItem>>(
      `/api/v1/milestones/${milestoneId}/deliverables`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getDeliverablesByMilestone: async (
    milestoneId: number
  ): Promise<ApiResponse<MilestoneDeliverableItem[]>> => {
    const response = await apiClient.get<ApiResponse<MilestoneDeliverableItem[]>>(
      `/api/v1/milestones/${milestoneId}/deliverables`
    );
    return response.data;
  },

  getViewUrl: (id: number): string => `/api/v1/deliverables/${id}/view`,

  getDownloadUrl: (id: number): string => `/api/v1/deliverables/${id}/download?download=true`,

  downloadDeliverableFile: async (id: number, fileName: string): Promise<void> => {
    const response = await apiClient.get(`/api/v1/deliverables/${id}/download?download=true`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getDeliverableBlobUrl: async (id: number): Promise<{ url: string; mimeType: string }> => {
    const response = await apiClient.get(`/api/v1/deliverables/${id}/view`, {
      responseType: 'blob',
    });
    const mimeType = String(response.headers['content-type'] || 'application/octet-stream');
    const blob = new Blob([response.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    return { url, mimeType };
  },
};
