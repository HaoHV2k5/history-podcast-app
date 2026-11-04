import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { MilestoneDeliverableItem } from '@/types/deliverable';

const inferMimeType = (fileName?: string, headerContentType?: string): string => {
  const raw = (headerContentType || '').split(';')[0].trim().toLowerCase();
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';

  const extMap: Record<string, string> = {
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    txt: 'text/plain;charset=utf-8',
    md: 'text/plain;charset=utf-8',
    csv: 'text/plain;charset=utf-8',
    json: 'application/json',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  if (ext && extMap[ext]) {
    return extMap[ext];
  }
  if (raw && raw !== 'application/octet-stream') {
    return raw;
  }
  return 'application/octet-stream';
};

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

  getDeliverableBlobUrl: async (id: number, fileName?: string): Promise<{ url: string; mimeType: string }> => {
    const response = await apiClient.get(`/api/v1/deliverables/${id}/view`, {
      responseType: 'blob',
    });
    const mimeType = inferMimeType(fileName, String(response.headers['content-type'] || ''));
    const blob = new Blob([response.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    return { url, mimeType };
  },
};
