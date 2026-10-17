import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  CreatorVideoItem,
  CreatorVideoDetail,
  CreatorVideosQueryParams,
} from '@/types/creatorContent';

export interface BusinessApiErrorPayload {
  success: boolean;
  message: string;
  errorCode?: string;
  timestamp?: string;
}

export class BusinessApiError extends Error {
  errorCode?: string;
  response?: {
    status: number;
    data: BusinessApiErrorPayload;
  };

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = 'BusinessApiError';
    this.errorCode = errorCode;
    this.response = {
      status: errorCode === 'ERR_1002' ? 404 : errorCode === 'ERR_1004' ? 403 : 400,
      data: {
        success: false,
        message,
        errorCode,
      },
    };
  }
}

export const creatorStudioApi = {
  /**
   * Danh sách, Tìm kiếm & Lọc video/podcast của Creator
   * GET /api/v1/creator/studio/videos
   */
  getVideos: async (params?: CreatorVideosQueryParams): Promise<ApiResponse<CreatorVideoItem[]>> => {
    const res = await apiClient.get<ApiResponse<CreatorVideoItem[]>>('/api/v1/creator/studio/videos', {
      params,
    });
    // Defensive check: If Backend returns HTTP 200 with success: false envelope
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể lấy danh sách video',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Chi tiết video và tương tác của Creator (chống IDOR, xác thực quyền sở hữu)
   * GET /api/v1/creator/studio/videos/{contentId}
   */
  getVideoDetail: async (contentId: number): Promise<ApiResponse<CreatorVideoDetail>> => {
    const res = await apiClient.get<ApiResponse<CreatorVideoDetail>>(`/api/v1/creator/studio/videos/${contentId}`);
    // Defensive check: If Backend returns HTTP 200 with success: false envelope
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không tìm thấy video hoặc bạn không có quyền truy cập',
        res.data.errorCode
      );
    }
    return res.data;
  },
};
