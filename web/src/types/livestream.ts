import { PageResponse } from './api';

/**
 * Trạng thái phiên phát sóng trực tiếp
 */
export type LivestreamStatus = 'LIVE' | 'ENDED';

/**
 * Vai trò kết nối Agora WebRTC
 */
export type AgoraRole = 'PUBLISHER' | 'SUBSCRIBER';

/**
 * DTO yêu cầu khởi tạo phiên livestream mới
 * POST /api/v1/livestreams
 */
export interface CreateLivestreamRequest {
  channelId: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isExclusive?: boolean;
}

/**
 * Thông tin chi tiết phiên livestream từ backend
 * Khớp với com.prm.livestream.dto.response.LivestreamResponse
 */
export interface LivestreamSession {
  id: number;
  channelId: number;
  channelName: string;
  channelAvatarUrl?: string | null;
  creatorId: number;
  creatorName: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  agoraChannelName: string;
  isExclusive: boolean;
  status: LivestreamStatus;
  viewerCount: number;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
}

/**
 * Phản hồi danh sách livestream có phân trang
 */
export type LivestreamPageResponse = PageResponse<LivestreamSession>;

/**
 * Tham số lọc và phân trang danh sách livestream
 * GET /api/v1/livestreams
 */
export interface GetLivestreamsParams {
  status?: LivestreamStatus;
  channelId?: number;
  page?: number;
  size?: number;
}

/**
 * DTO phản hồi cấp Token Agora RTC
 * POST /api/v1/livestreams/{id}/join
 * Khớp với com.prm.livestream.dto.response.LivestreamTokenResponse
 */
export interface LivestreamTokenResponse {
  appId: string;
  token: string;
  agoraChannelName: string;
  uid: number;
  role: AgoraRole | string;
  expirationSeconds: number;
}

/**
 * DTO tin nhắn trong phòng Live Chat
 * Khớp với com.prm.livestream.dto.response.LivestreamChatMessageResponse
 */
export interface LivestreamChatMessage {
  id: string;
  author: string;
  role: 'creator' | 'viewer' | string;
  text: string;
  timestamp: number;
  timeFormatted?: string;
}

/**
 * Payload gửi tin nhắn chat
 * POST /api/v1/livestreams/{id}/chats
 */
export interface SendChatMessageRequest {
  id?: string;
  author?: string;
  role?: string;
  text: string;
}

/**
 * Tham số polling lấy tin nhắn chat
 * GET /api/v1/livestreams/{id}/chats
 */
export interface GetChatMessagesParams {
  since?: number;
}

/**
 * Mã lỗi nghiệp vụ chuẩn từ Backend cho phân hệ Livestream
 */
export const LIVESTREAM_ERROR_CODES = {
  NOT_FOUND: 'LIVE_4001',
  ALREADY_ENDED: 'LIVE_4002',
  MEMBER_REQUIRED: 'LIVE_4003',
  FORBIDDEN_ACCESS: 'ERR_1004',
  USER_NOT_FOUND: 'ERR_1002',
  CHANNEL_NOT_FOUND: 'CHAN_4001',
} as const;

export type LivestreamErrorCode =
  (typeof LIVESTREAM_ERROR_CODES)[keyof typeof LIVESTREAM_ERROR_CODES];

/**
 * Lớp lỗi tùy chỉnh cho các cuộc gọi API phân hệ Livestream
 */
export class LivestreamApiError extends Error {
  errorCode?: string;
  status?: number;
  data?: unknown;

  constructor(message: string, errorCode?: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'LivestreamApiError';
    this.errorCode = errorCode;
    this.status = status;
    this.data = data;
  }
}
