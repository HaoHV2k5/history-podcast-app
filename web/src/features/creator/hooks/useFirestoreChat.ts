import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  chatsApi,
  FirestoreChatMessage,
  SendFirestoreMessageInput,
} from '@/services/api/chats';
import { useAuthStore } from '@/store/authStore';

export interface UseFirestoreChatOptions {
  conversationId?: string | null;
  fallbackConversationId?: string | null;
  enabled: boolean;
  initialPageSize?: number;
  pageStep?: number;
}

const DEFAULT_INITIAL_PAGE_SIZE = 15;
const DEFAULT_PAGE_STEP = 15;

export const useFirestoreChat = ({
  conversationId,
  fallbackConversationId,
  enabled,
  initialPageSize = DEFAULT_INITIAL_PAGE_SIZE,
  pageStep = DEFAULT_PAGE_STEP,
}: UseFirestoreChatOptions) => {
  const user = useAuthStore((s) => s.user);
  const activeConversationId = conversationId || fallbackConversationId || null;

  const [messages, setMessages] = useState<FirestoreChatMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(initialPageSize);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Reset pagination window when switching conversations
  useEffect(() => {
    setVisibleCount(initialPageSize);
    setMessages([]);
    setChatError(null);
  }, [activeConversationId, initialPageSize]);

  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!activeConversationId || !enabled) return;
      if (!silent) setIsLoadingMessages(true);
      try {
        const list = await chatsApi.listFirestoreMessages(activeConversationId);
        setMessages(list);
        setChatError(null);
      } catch (err) {
        if (!silent) {
          setChatError(
            err instanceof Error
              ? err.message
              : 'Không thể đồng bộ tin nhắn từ Firebase Firestore'
          );
        }
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [activeConversationId, enabled]
  );

  // Initial fetch & real-time polling + cross-tab BroadcastChannel sync
  useEffect(() => {
    if (!enabled || !activeConversationId) return;

    fetchMessages(false);

    const intervalId = window.setInterval(() => {
      fetchMessages(true);
    }, 2500);

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`firestore_chat_${activeConversationId}`);
      bc.onmessage = () => {
        fetchMessages(true);
      };
      broadcastRef.current = bc;
    }

    return () => {
      window.clearInterval(intervalId);
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
    };
  }, [activeConversationId, enabled, fetchMessages]);

  // Messenger-style windowed messages (render latest `visibleCount` messages, load more on scroll up)
  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleCount) return messages;
    return messages.slice(messages.length - visibleCount);
  }, [messages, visibleCount]);

  const hasMoreOlder = messages.length > visibleCount;
  const olderHiddenCount = Math.max(0, messages.length - visibleCount);

  const loadOlderMessages = useCallback(() => {
    if (!hasMoreOlder || isLoadingOlder) return;
    setIsLoadingOlder(true);
    window.setTimeout(() => {
      setVisibleCount((prev) => prev + pageStep);
      setIsLoadingOlder(false);
    }, 160);
  }, [hasMoreOlder, isLoadingOlder, pageStep]);

  const sendMessage = useCallback(
    async (text: string, imageFile?: File | null): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed && !imageFile) return false;
      if (!activeConversationId) {
        setChatError('Phòng chat chưa sẵn sàng. Vui lòng thử lại.');
        return false;
      }

      setChatError(null);
      setIsSending(true);

      let uploadedImageUrl: string | null = null;
      try {
        if (imageFile) {
          setIsUploadingImage(true);
          uploadedImageUrl = await chatsApi.uploadChatImage(imageFile, activeConversationId);
          setIsUploadingImage(false);
        }

        const senderId = Number(user?.id) || 0;
        const senderName = user?.fullName || user?.email || 'Nhà sáng tạo';
        const payload: SendFirestoreMessageInput = {
          senderId,
          senderRole: 'CREATOR',
          senderName,
          text: trimmed,
          imageUrl: uploadedImageUrl,
        };

        const savedMsg = await chatsApi.sendFirestoreMessage(
          activeConversationId,
          payload
        );

        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        setVisibleCount((prev) => prev + 1);

        broadcastRef.current?.postMessage({ type: 'NEW_MESSAGE', id: savedMsg.id });
        return true;
      } catch (err) {
        setIsUploadingImage(false);
        setChatError(
          err instanceof Error
            ? err.message
            : 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối mạng.'
        );
        return false;
      } finally {
        setIsSending(false);
        setIsUploadingImage(false);
      }
    },
    [activeConversationId, user?.email, user?.fullName, user?.id]
  );

  const isOwnMessage = useCallback(
    (msg: FirestoreChatMessage): boolean => {
      if (user?.id && msg.senderId && Number(user.id) === Number(msg.senderId)) {
        return true;
      }
      return msg.senderRole === 'CREATOR';
    },
    [user?.id]
  );

  return {
    activeConversationId,
    messages,
    visibleMessages,
    hasMoreOlder,
    olderHiddenCount,
    isLoadingOlder,
    loadOlderMessages,
    isLoadingMessages,
    isSending,
    isUploadingImage,
    chatError,
    setChatError,
    sendMessage,
    refreshMessages: () => fetchMessages(false),
    isOwnMessage,
  };
};
