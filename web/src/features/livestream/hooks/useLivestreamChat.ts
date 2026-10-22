import { useState, useEffect, useRef, useCallback } from 'react';
import { LivestreamChatMessage } from '@/types/livestream';
import { livestreamApi } from '@/services/api/livestream';
import { useAuthStore } from '@/store/authStore';
import {
  calculateNextChatCursor,
  calculateOverlappingPollCursor,
  deduplicateAndSortChatMessages,
  validateChatMessageInput,
} from '../livestreamLogic';

export interface UseLivestreamChatOptions {
  sessionId?: number;
  isSessionEnded?: boolean;
  pollIntervalMs?: number; // Mặc định: 2500ms (~2.5s)
  overlapWindowMs?: number; // Mặc định: 1000ms (1s cửa sổ trùng lặp để tránh rơi rụng tin nhắn cùng timestamp)
  maxRetainedMessages?: number; // Mặc định: 200 tin nhắn
  enabled?: boolean;
}

export interface UseLivestreamChatReturn {
  messages: LivestreamChatMessage[];
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<{ success: boolean; error?: string }>;
  isSending: boolean;
  clearMessages: () => void;
  refetch: () => Promise<void>;
}

export function useLivestreamChat({
  sessionId,
  isSessionEnded = false,
  pollIntervalMs = 2500,
  overlapWindowMs = 1000,
  maxRetainedMessages = 200,
  enabled = true,
}: UseLivestreamChatOptions): UseLivestreamChatReturn {
  const [messages, setMessages] = useState<LivestreamChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Lấy thông tin tài khoản hiện tại từ authStore để gán tên tác giả
  const currentUser = useAuthStore((s) => s.user);

  // References quản lý vòng đời và tránh race conditions
  const isMountedRef = useRef(true);
  const activeSessionIdRef = useRef<number | undefined>(sessionId);
  const isPollingRef = useRef(false);
  const logicalCursorRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);

  // Cập nhật sessionId hiện hành
  useEffect(() => {
    activeSessionIdRef.current = sessionId;
  }, [sessionId]);

  // Dọn dẹp timer
  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Xóa danh sách tin nhắn và reset con trỏ
  const clearMessages = useCallback(() => {
    setMessages([]);
    logicalCursorRef.current = 0;
    setError(null);
  }, []);

  /**
   * Thực hiện một chu kỳ poll lấy tin nhắn mới
   * @param isReconcile Gọi ngay sau khi vừa gửi tin nhắn để đối soát nhanh
   */
  const pollChatMessages = useCallback(
    async (isInitial = false, isReconcile = false) => {
      // Điều kiện dừng: không có sessionId, session đã kết thúc, unmount hoặc đang có request in-flight
      if (
        !sessionId ||
        isNaN(sessionId) ||
        sessionId <= 0 ||
        isSessionEnded ||
        !enabled ||
        !isMountedRef.current
      ) {
        return;
      }

      if (isPollingRef.current && !isReconcile) {
        // Đang có yêu cầu mạng chưa xong, bỏ qua để tránh dồn ứ (overlapping requests)
        return;
      }

      isPollingRef.current = true;
      if (isInitial) {
        setIsLoading(true);
      }
      setIsPolling(true);

      // Tính toán giá trị since gửi lên backend:
      // Nếu logicalCursor > 0, lùi lại overlapWindowMs mili-giây để bắt các tin nhắn
      // có cùng timestamp xuất hiện trong chu kỳ trước (khắc phục m.getTimestamp() > since).
      const sinceQuery = calculateOverlappingPollCursor(
        logicalCursorRef.current,
        overlapWindowMs
      );

      try {
        const response = await livestreamApi.getChatMessages(sessionId, {
          since: sinceQuery,
        });

        // Kiểm tra sau async xem component có còn mount và sessionId có đổi không
        if (!isMountedRef.current || activeSessionIdRef.current !== sessionId) {
          return;
        }

        const incoming = response?.data || [];

        if (incoming.length > 0) {
          // Cập nhật con trỏ logic tịnh tiến tăng dần (monotonically advancing)
          const nextCursor = calculateNextChatCursor(
            logicalCursorRef.current,
            incoming
          );
          logicalCursorRef.current = Math.max(logicalCursorRef.current, nextCursor);

          // Hợp nhất, khử trùng lặp theo ID và sắp xếp theo thời gian.
          // Chỉ cập nhật state nếu thực sự có tin nhắn mới để tránh kích hoạt cuộn trang mỗi 2.5s.
          setMessages((prev) => {
            const merged = deduplicateAndSortChatMessages(
              prev,
              incoming,
              maxRetainedMessages
            );
            if (
              merged.length === prev.length &&
              merged[merged.length - 1]?.id === prev[prev.length - 1]?.id
            ) {
              return prev;
            }
            return merged;
          });
        }

        // Reset bộ đếm lỗi khi kết nối thành công
        consecutiveErrorsRef.current = 0;
        setError(null);
      } catch (err: unknown) {
        if (!isMountedRef.current || activeSessionIdRef.current !== sessionId) {
          return;
        }

        consecutiveErrorsRef.current += 1;
        // Chỉ hiển thị cảnh báo lỗi nếu liên tiếp thất bại >= 2 chu kỳ để tránh nhấp nháy UI
        if (consecutiveErrorsRef.current >= 2) {
          const errMsg =
            (err as { message?: string })?.message ||
            'Tạm thời mất kết nối Live Chat. Đang tự động kết nối lại...';
          setError(errMsg);
        }
      } finally {
        if (isMountedRef.current && activeSessionIdRef.current === sessionId) {
          isPollingRef.current = false;
          if (isInitial) {
            setIsLoading(false);
          }
          setIsPolling(false);

          // Lên lịch cho chu kỳ kế tiếp nếu phiên live vẫn đang hoạt động
          if (!isSessionEnded && enabled) {
            clearPollTimer();
            // Nếu có lỗi, kéo giãn nhẹ (backoff: interval + 1000ms), bình thường dùng pollIntervalMs
            const nextDelay =
              consecutiveErrorsRef.current > 0
                ? pollIntervalMs + 1000
                : pollIntervalMs;

            pollTimerRef.current = setTimeout(() => {
              pollChatMessages(false);
            }, nextDelay);
          }
        }
      }
    },
    [
      sessionId,
      isSessionEnded,
      enabled,
      overlapWindowMs,
      maxRetainedMessages,
      pollIntervalMs,
      clearPollTimer,
    ]
  );

  /**
   * Refetch thủ công theo yêu cầu của giao diện
   */
  const refetch = useCallback(async () => {
    clearPollTimer();
    await pollChatMessages(false, true);
  }, [clearPollTimer, pollChatMessages]);

  /**
   * Gửi tin nhắn Live Chat với tư cách Creator (Host)
   */
  const sendMessage = useCallback(
    async (text: string): Promise<{ success: boolean; error?: string }> => {
      if (!sessionId || isSessionEnded) {
        return {
          success: false,
          error: 'Phiên phát sóng không hợp lệ hoặc đã kết thúc.',
        };
      }

      const validation = validateChatMessageInput(text);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      if (isSending) {
        return {
          success: false,
          error: 'Đang gửi tin nhắn trước, vui lòng chờ trong giây lát.',
        };
      }

      setIsSending(true);

      try {
        // Sinh UUID duy nhất ở frontend để hỗ trợ khử trùng lặp và đối soát mượt mà
        const clientMsgId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const authorName =
          currentUser?.fullName || currentUser?.email || 'Chủ phòng (Host)';

        await livestreamApi.sendChatMessage(sessionId, {
          id: clientMsgId,
          author: authorName,
          role: 'creator',
          text: validation.trimmedText,
        });

        // Sau khi gửi thành công lên backend, kích hoạt ngay chu kỳ poll để cập nhật khung chat
        if (isMountedRef.current && activeSessionIdRef.current === sessionId) {
          clearPollTimer();
          // Gọi pollChatMessages đối soát ngay lập tức
          pollChatMessages(false, true);
        }

        return { success: true };
      } catch (err: unknown) {
        const errorMsg =
          (err as { message?: string })?.message ||
          'Không thể gửi tin nhắn. Vui lòng kiểm tra lại kết nối mạng.';
        return { success: false, error: errorMsg };
      } finally {
        if (isMountedRef.current) {
          setIsSending(false);
        }
      }
    },
    [sessionId, isSessionEnded, isSending, currentUser, clearPollTimer, pollChatMessages]
  );

  // Khởi động chu kỳ polling khi sessionId thay đổi hoặc mount
  useEffect(() => {
    isMountedRef.current = true;
    activeSessionIdRef.current = sessionId;
    clearMessages();

    if (sessionId && !isSessionEnded && enabled) {
      // Khởi chạy lần lấy tin nhắn đầu tiên
      pollChatMessages(true);
    }

    return () => {
      isMountedRef.current = false;
      clearPollTimer();
    };
  }, [sessionId, isSessionEnded, enabled, clearMessages, pollChatMessages, clearPollTimer]);

  return {
    messages,
    isLoading,
    isPolling,
    error,
    sendMessage,
    isSending,
    clearMessages,
    refetch,
  };
}
