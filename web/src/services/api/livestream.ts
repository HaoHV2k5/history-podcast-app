import axios, { AxiosError } from 'axios';
import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  LivestreamSession,
  CreateLivestreamRequest,
  GetLivestreamsParams,
  LivestreamTokenResponse,
  LivestreamChatMessage,
  SendChatMessageRequest,
  GetChatMessagesParams,
  LivestreamApiError,
} from '@/types/livestream';

export { LivestreamApiError };

/**
 * Trích xuất và chuẩn hóa lỗi trả về từ Axios / Spring Boot API
 */
export function handleLivestreamApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const responseData = axiosError.response?.data;
    const errorCode = responseData?.errorCode;
    const message =
      responseData?.message || axiosError.message || 'Lỗi tương tác với dịch vụ Livestream';
    const status = axiosError.response?.status;
    throw new LivestreamApiError(message, errorCode, status, responseData);
  }
  if (error instanceof Error) {
    throw new LivestreamApiError(error.message);
  }
  throw new LivestreamApiError('Đã xảy ra lỗi không xác định');
}

export const livestreamApi = {
  /**
   * 1. Khởi tạo phiên livestream mới (Role: CREATOR sở hữu kênh)
   * POST /api/v1/livestreams
   */
  createSession: async (
    request: CreateLivestreamRequest
  ): Promise<ApiResponse<LivestreamSession>> => {
    try {
      const response = await apiClient.post<ApiResponse<LivestreamSession>>(
        '/api/v1/livestreams',
        request
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 2. Lấy danh sách phiên livestream có phân trang và lọc theo trạng thái/kênh
   * GET /api/v1/livestreams
   */
  getLivestreams: async (
    params?: GetLivestreamsParams
  ): Promise<ApiResponse<PageResponse<LivestreamSession>>> => {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<LivestreamSession>>>(
        '/api/v1/livestreams',
        { params }
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 3. Xem chi tiết thông tin một phiên livestream
   * GET /api/v1/livestreams/{id}
   */
  getSession: async (id: number): Promise<ApiResponse<LivestreamSession>> => {
    try {
      const response = await apiClient.get<ApiResponse<LivestreamSession>>(
        `/api/v1/livestreams/${id}`
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 4. Gia nhập phòng và lấy Token kết nối Agora RTC (Creator: PUBLISHER, Viewer: SUBSCRIBER)
   * POST /api/v1/livestreams/{id}/join
   */
  getJoinToken: async (
    id: number,
    clientUid?: number
  ): Promise<ApiResponse<LivestreamTokenResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<LivestreamTokenResponse>>(
        `/api/v1/livestreams/${id}/join`,
        null,
        {
          params: clientUid ? { clientUid } : undefined,
        }
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 5. Rời phòng hoặc tạm dừng phát sóng (Giảm số người xem trực tiếp hoặc reset về 0)
   * POST /api/v1/livestreams/{id}/leave
   */
  leaveSession: async (
    id: number,
    reset: boolean = false
  ): Promise<ApiResponse<LivestreamSession>> => {
    try {
      const response = await apiClient.post<ApiResponse<LivestreamSession>>(
        `/api/v1/livestreams/${id}/leave`,
        null,
        {
          params: reset ? { reset: true } : undefined,
        }
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 6. Kết thúc phiên livestream (Chỉ Creator sở hữu phòng mới có quyền)
   * POST /api/v1/livestreams/{id}/end
   */
  endSession: async (id: number): Promise<ApiResponse<LivestreamSession>> => {
    try {
      const response = await apiClient.post<ApiResponse<LivestreamSession>>(
        `/api/v1/livestreams/${id}/end`
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 6. Gửi tin nhắn vào phòng Live Chat
   * POST /api/v1/livestreams/{id}/chats
   */
  sendChatMessage: async (
    id: number,
    message: SendChatMessageRequest
  ): Promise<ApiResponse<void>> => {
    try {
      const payload: Record<string, string> = {
        text: message.text,
      };
      if (message.id) payload.id = message.id;
      if (message.author) payload.author = message.author;
      if (message.role) payload.role = message.role;

      const response = await apiClient.post<ApiResponse<void>>(
        `/api/v1/livestreams/${id}/chats`,
        payload
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },

  /**
   * 7. Lấy danh sách tin nhắn mới theo con trỏ thời gian (Polling)
   * GET /api/v1/livestreams/{id}/chats?since={timestamp}
   */
  getChatMessages: async (
    id: number,
    params?: GetChatMessagesParams
  ): Promise<ApiResponse<LivestreamChatMessage[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<LivestreamChatMessage[]>>(
        `/api/v1/livestreams/${id}/chats`,
        {
          params: {
            since: params?.since ?? 0,
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleLivestreamApiError(error);
    }
  },
};
