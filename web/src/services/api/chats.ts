import { apiClient } from './client';
import { ApiResponse } from '@/types/api';

export interface GetConversationPayload {
  hireRequestId?: number;
  contractId?: number;
}

export interface ChatConversationItem {
  conversationId: string;
  topicTitle: string;
  channelName?: string;
  hireRequestId?: number;
  contractId?: number;
  partnerId: number;
  partnerName: string;
  partnerEmail?: string;
  partnerAvatarUrl?: string;
  partnerRole?: string;
  contextType?: string;
}

export const chatsApi = {
  getOrCreateConversation: async (
    payload: GetConversationPayload
  ): Promise<ApiResponse<ChatConversationItem>> => {
    const response = await apiClient.post<ApiResponse<ChatConversationItem>>(
      '/api/v1/chats/conversation',
      payload
    );
    return response.data;
  },
};

