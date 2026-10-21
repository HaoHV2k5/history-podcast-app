import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Crown,
  User,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLivestreamChat } from '../hooks/useLivestreamChat';
import { formatChatRoleBadge, validateChatMessageInput } from '../livestreamLogic';

interface LivestreamChatPanelProps {
  sessionId: number;
  isSessionEnded?: boolean;
  className?: string;
}

export const LivestreamChatPanel: React.FC<LivestreamChatPanelProps> = ({
  sessionId,
  isSessionEnded = false,
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    isPolling,
    error: chatError,
    sendMessage,
    isSending,
    refetch,
  } = useLivestreamChat({
    sessionId,
    isSessionEnded,
    pollIntervalMs: 2500,
    overlapWindowMs: 1000,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollEnabledRef = useRef(true);

  // Tự động cuộn nội bộ khung chat xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (isAutoScrollEnabledRef.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    isAutoScrollEnabledRef.current = isAtBottom;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSessionEnded || isSending) return;

    const validation = validateChatMessageInput(inputText);
    if (!validation.valid) {
      setValidationError(validation.error || 'Nội dung tin nhắn không hợp lệ');
      return;
    }

    setValidationError(null);
    const result = await sendMessage(validation.trimmedText);

    if (result.success) {
      setInputText('');
      isAutoScrollEnabledRef.current = true;
    } else {
      setValidationError(result.error || 'Không thể gửi tin nhắn');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-surface shadow-xs overflow-hidden h-[480px] lg:h-full min-h-0 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5 bg-surface-subtle/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif text-xs font-bold text-ink">
              Trò chuyện trực tiếp
            </h3>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
              {messages.length}
            </Badge>
          </div>
        </div>

        {/* Polling / Connection State Indicator */}
        <div className="flex items-center gap-1.5">
          {!isSessionEnded && (
            <div
              className="flex items-center gap-1 text-[10px] text-muted"
              title={isPolling ? 'Đang cập nhật tin nhắn...' : 'Trạng thái kết nối tốt'}
            >
              {isPolling ? (
                <Wifi className="h-3 w-3 text-emerald-500 animate-pulse" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              <span className="hidden sm:inline font-mono">
                {isPolling ? 'Đồng bộ' : 'Trực tuyến'}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isSessionEnded || isLoading}
            className="h-6 w-6 p-0 text-muted hover:text-ink"
            title="Làm mới tin nhắn"
            aria-label="Làm mới tin nhắn"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Network Alert Bar */}
      {chatError && !isSessionEnded && (
        <div className="flex items-center justify-between bg-amber-50 px-3 py-1 border-b border-amber-200 text-[11px] text-amber-800 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <WifiOff className="h-3 w-3 shrink-0 text-amber-600" />
            <span className="truncate">{chatError}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-[10px] font-semibold underline text-amber-900 shrink-0 ml-2 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Message List Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-canvas/30 text-xs min-h-0"
      >
        {isLoading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-8 text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <p className="text-[11px]">Đang tải cuộc trò chuyện...</p>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-8 text-center text-muted">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-accent/70">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-serif text-xs font-semibold text-ink">
                Chưa có tin nhắn nào
              </p>
              <p className="text-[11px] text-muted max-w-[200px]">
                Hãy gửi lời chào đầu tiên tới các thính giả đang theo dõi!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const roleInfo = formatChatRoleBadge(msg.role);
          const isCreator = roleInfo.isCreator;

          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1 rounded-lg p-2 transition-colors ${
                isCreator
                  ? 'border border-amber-200/80 bg-amber-50/50'
                  : 'border border-border/50 bg-surface'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  {isCreator ? (
                    <Crown className="h-3 w-3 text-amber-600 shrink-0" />
                  ) : (
                    <User className="h-3 w-3 text-muted shrink-0" />
                  )}

                  <span
                    className={`font-semibold truncate ${
                      isCreator ? 'text-amber-950 font-bold' : 'text-ink'
                    }`}
                  >
                    {msg.author || (isCreator ? 'Chủ phòng' : 'Thính giả')}
                  </span>

                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold tracking-wide ${
                      isCreator
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-surface-subtle text-muted'
                    }`}
                  >
                    {roleInfo.label}
                  </span>
                </div>

                <span className="font-mono text-[10px] text-muted shrink-0">
                  {msg.timeFormatted ||
                    (msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '')}
                </span>
              </div>

              <p className="text-[12px] leading-snug text-ink break-words whitespace-pre-wrap pl-4">
                {msg.text}
              </p>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Validation Error Feedback */}
      {validationError && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[11px] text-rose-700 border-t border-rose-200 shrink-0">
          <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
          <span className="truncate">{validationError}</span>
        </div>
      )}

      {/* Compact Message Composer Footer */}
      <form
        onSubmit={handleSend}
        className="border-t border-border px-3 py-2.5 bg-surface shrink-0"
      >
        <div className="flex items-center gap-2">
          <input
            id="livestream-chat-input"
            aria-label="Nội dung tin nhắn trò chuyện"
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isSessionEnded || isSending}
            placeholder={
              isSessionEnded
                ? 'Phiên phát sóng đã kết thúc.'
                : 'Nhập tin nhắn trò chuyện... (Enter để gửi)'
            }
            maxLength={500}
            className="flex-1 rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:bg-surface-subtle h-8.5"
          />

          <Button
            type="submit"
            size="sm"
            disabled={isSessionEnded || isSending || !inputText.trim()}
            className="h-8.5 px-3 bg-accent hover:bg-accent-hover text-canvas font-semibold gap-1.5 shrink-0"
            title="Gửi tin nhắn"
            aria-label="Gửi tin nhắn"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline text-xs">Gửi</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
