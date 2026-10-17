import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import {
  CreatorVideoItem,
  CreatorVideoDetail,
  CreatorVideosQueryParams,
} from '@/types/creatorContent';
import {
  CreatorAiSetting,
  CreatorAiSettingRequest,
  CreatorVoiceItem,
  CreatorVoicePreviewRequest,
  CreatorVoicePreviewResponse,
  CreatorStoryboardRequest,
  StoryboardResponse,
  VerifyScriptRequest,
  ScriptVerificationResponse,
} from '@/types/creatorStudio';

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
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không tìm thấy video hoặc bạn không có quyền truy cập',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Lấy cấu hình AI của Creator (Gemini API key, ElevenLabs key, TTS engine, voice)
   * GET /api/v1/creator/studio/settings
   */
  getSettings: async (): Promise<ApiResponse<CreatorAiSetting>> => {
    const res = await apiClient.get<ApiResponse<CreatorAiSetting>>('/api/v1/creator/studio/settings');
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể lấy cấu hình AI',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Lưu / Cập nhật cấu hình AI của Creator
   * PUT /api/v1/creator/studio/settings
   */
  saveSettings: async (request: CreatorAiSettingRequest): Promise<ApiResponse<CreatorAiSetting>> => {
    const res = await apiClient.put<ApiResponse<CreatorAiSetting>>('/api/v1/creator/studio/settings', request);
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể lưu cấu hình AI',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Lấy danh mục giọng đọc AI thuyết minh sử Việt (Edge-TTS & ElevenLabs)
   * GET /api/v1/creator/studio/voices
   */
  getVoices: async (): Promise<ApiResponse<CreatorVoiceItem[]>> => {
    const res = await apiClient.get<ApiResponse<CreatorVoiceItem[]>>('/api/v1/creator/studio/voices');
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể lấy danh mục giọng đọc',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Tạo bản nghe thử giọng đọc trực tiếp
   * POST /api/v1/creator/studio/voices/preview
   */
  previewVoice: async (request: CreatorVoicePreviewRequest): Promise<ApiResponse<CreatorVoicePreviewResponse>> => {
    const res = await apiClient.post<ApiResponse<CreatorVoicePreviewResponse>>(
      '/api/v1/creator/studio/voices/preview',
      request
    );
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể tạo âm thanh nghe thử',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Khởi tạo phân cảnh kịch bản và gợi ý prompt (Chưa lưu DB, xem trước)
   * POST /api/v1/creator/studio/storyboard
   */
  generateStoryboard: async (request: CreatorStoryboardRequest): Promise<ApiResponse<StoryboardResponse>> => {
    const res = await apiClient.post<ApiResponse<StoryboardResponse>>(
      '/api/v1/creator/studio/storyboard',
      request
    );
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể khởi tạo phân cảnh kịch bản',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Thẩm định kịch bản sử liệu đối chiếu với kho RAG & gợi ý thumbnail 1:1
   * POST /api/v1/creator/studio/verify-script
   */
  verifyScript: async (request: VerifyScriptRequest): Promise<ApiResponse<ScriptVerificationResponse>> => {
    const res = await apiClient.post<ApiResponse<ScriptVerificationResponse>>(
      '/api/v1/creator/studio/verify-script',
      request
    );
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể thẩm định kịch bản sử liệu',
        res.data.errorCode
      );
    }
    return res.data;
  },

  /**
   * Chỉnh sửa thông tin tác phẩm (tiêu đề title, tóm tắt/mô tả description, độc quyền VIP isExclusive)
   * Lưu ý: Không hỗ trợ lưu trực tiếp textBody qua endpoint này theo Backend contract.
   * PUT /api/v1/creator/studio/videos/{contentId}
   */
  updateVideo: async (
    contentId: number,
    request: { title: string; description?: string; isExclusive?: boolean }
  ): Promise<ApiResponse<CreatorVideoItem>> => {
    const res = await apiClient.put<ApiResponse<CreatorVideoItem>>(
      `/api/v1/creator/studio/videos/${contentId}`,
      request
    );
    if (res.data && res.data.success === false) {
      throw new BusinessApiError(
        res.data.message || 'Không thể cập nhật thông tin tác phẩm',
        res.data.errorCode
      );
    }
    return res.data;
  },
};
