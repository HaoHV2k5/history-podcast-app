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

export interface FirestoreChatMessage {
  id: string;
  senderId: number;
  senderRole: 'CREATOR' | 'LISTENER' | string;
  senderName: string;
  text: string;
  imageUrl: string | null;
  createdAt: string; // ISO string
  timeFormatted: string;
}

export interface SendFirestoreMessageInput {
  senderId: number;
  senderRole: 'CREATOR' | 'LISTENER';
  senderName: string;
  text: string;
  imageUrl?: string | null;
}

interface FirestoreFieldValue {
  stringValue?: string;
  integerValue?: string | number;
  timestampValue?: string;
  nullValue?: null;
}

interface FirestoreRawDocument {
  name: string;
  fields?: Record<string, FirestoreFieldValue>;
  createTime?: string;
}

interface FirestoreListResponse {
  documents?: FirestoreRawDocument[];
}

const getFirebaseConfig = () => {
  const projectId =
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() ||
    'history-podcast-app';
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || '';
  return { projectId, apiKey };
};

const buildFirestoreMessagesUrl = (conversationId: string): string => {
  const { projectId, apiKey } = getFirebaseConfig();
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/conversations/${encodeURIComponent(conversationId)}/messages`;
  return apiKey ? `${base}?key=${encodeURIComponent(apiKey)}` : base;
};

const formatMessageTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const now = new Date();
    const isSameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isSameDay) {
      return `${hours}:${minutes}`;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${hours}:${minutes} • ${day}/${month}`;
  } catch {
    return '';
  }
};

const parseFirestoreDoc = (doc: FirestoreRawDocument): FirestoreChatMessage => {
  const f = doc.fields || {};
  const id = doc.name ? doc.name.split('/').pop() || doc.name : `msg-${Date.now()}`;
  const rawSenderId = f.senderId?.integerValue ?? f.senderId?.stringValue ?? 0;
  const senderId = Number(rawSenderId) || 0;
  const senderRole = f.senderRole?.stringValue || 'CREATOR';
  const senderName = f.senderName?.stringValue || f.sender?.stringValue || 'Người dùng';
  const text = f.text?.stringValue || '';
  const imageUrl = f.imageUrl?.stringValue || null;
  const createdAt =
    f.createdAt?.timestampValue ||
    f.createdAt?.stringValue ||
    f.timestamp?.timestampValue ||
    doc.createTime ||
    new Date().toISOString();

  return {
    id,
    senderId,
    senderRole,
    senderName,
    text,
    imageUrl,
    createdAt,
    timeFormatted: formatMessageTime(createdAt),
  };
};

export const chatsApi = {
  /**
   * 1. Xác thực quyền truy cập & lấy mã phòng conversationId trên Firestore
   * POST /api/v1/chats/conversation
   */
  getOrCreateConversation: async (
    payload: GetConversationPayload
  ): Promise<ApiResponse<ChatConversationItem>> => {
    const response = await apiClient.post<ApiResponse<ChatConversationItem>>(
      '/api/v1/chats/conversation',
      payload
    );
    return response.data;
  },

  /**
   * 2. Đọc danh sách tin nhắn từ Firebase Cloud Firestore
   * Collection: conversations/{conversationId}/messages
   */
  listFirestoreMessages: async (conversationId: string): Promise<FirestoreChatMessage[]> => {
    if (!conversationId) return [];
    const baseUrl = buildFirestoreMessagesUrl(conversationId);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}pageSize=100`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Không thể tải tin nhắn từ Firestore (HTTP ${res.status})`);
    }

    const data = (await res.json()) as FirestoreListResponse;
    const docs = Array.isArray(data.documents) ? data.documents : [];
    const messages = docs.map(parseFirestoreDoc);

    messages.sort((a, b) => {
      const tA = new Date(a.createdAt).getTime() || 0;
      const tB = new Date(b.createdAt).getTime() || 0;
      return tA - tB;
    });

    return messages;
  },

  /**
   * 3. Ghi tin nhắn mới trực tiếp lên Firebase Cloud Firestore
   * Collection: conversations/{conversationId}/messages
   */
  sendFirestoreMessage: async (
    conversationId: string,
    input: SendFirestoreMessageInput
  ): Promise<FirestoreChatMessage> => {
    if (!conversationId) {
      throw new Error('Chưa có mã phòng trò chuyện (conversationId)');
    }
    const url = buildFirestoreMessagesUrl(conversationId);
    const nowIso = new Date().toISOString();

    const body = {
      fields: {
        senderId: { integerValue: String(input.senderId || 0) },
        senderRole: { stringValue: input.senderRole },
        senderName: { stringValue: input.senderName || 'Creator' },
        text: { stringValue: (input.text || '').trim() },
        imageUrl: input.imageUrl
          ? { stringValue: input.imageUrl }
          : { nullValue: null },
        createdAt: { timestampValue: nowIso },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Gửi tin nhắn lên Firestore thất bại (HTTP ${res.status})`);
    }

    const savedDoc = (await res.json()) as FirestoreRawDocument;
    return parseFirestoreDoc(savedDoc);
  },

  /**
   * 4. Tải ảnh đính kèm trong Chat lên Cloudinary theo folder riêng (`chats/{conversationId}` hoặc `chats/messages`)
   * POST /api/v1/creator/studio/upload-image
   */
  uploadChatImage: async (file: File, conversationId?: string | null): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const safeConvFolder =
      conversationId && /^[a-zA-Z0-9_-]{1,64}$/.test(conversationId)
        ? `chats/${conversationId}`
        : 'chats/messages';
    formData.append('folder', safeConvFolder);

    const res = await apiClient.post<
      ApiResponse<{ imageUrl?: string; url?: string; fileUrl?: string } | string>
    >('/api/v1/creator/studio/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const payload = res.data?.data;
    if (typeof payload === 'string' && payload) return payload;
    if (payload && typeof payload === 'object') {
      const resolved = payload.imageUrl || payload.url || payload.fileUrl;
      if (resolved) return resolved;
    }

    throw new Error('Không nhận được đường dẫn ảnh sau khi tải lên');
  },
};
