import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  ShieldCheck,
  RefreshCw,
  Radio,
  FileCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatsApi, ChatConversationItem } from '@/services/api/chats';

interface CreatorCommissionChatModalProps {
  commissionId?: number | null;
  contractId?: number | null;
  topicTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenRoadmap?: () => void;
}

export const CreatorCommissionChatModal: React.FC<CreatorCommissionChatModalProps> = ({
  commissionId,
  contractId,
  topicTitle,
  isOpen,
  onClose,
  onOpenRoadmap,
}) => {
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<
    { id: string; sender: 'me' | 'partner'; text: string; time: string }[]
  >([
    {
      id: 'init-1',
      sender: 'partner',
      text: 'Chào bạn! Mình vừa gửi yêu cầu đặt sản xuất nội dung này, rất mong được kênh hỗ trợ.',
      time: 'Vừa xong',
    },
  ]);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['chat-conversation', commissionId, contractId],
    queryFn: () =>
      chatsApi.getOrCreateConversation({
        hireRequestId: commissionId || undefined,
        contractId: contractId || undefined,
      }),
    enabled: Boolean(commissionId || contractId) && isOpen,
  });

  const conversation: ChatConversationItem | null = response?.data || null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLocalMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'me',
        text: inputText.trim(),
        time: 'Vừa gửi',
      },
    ]);
    setInputText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-stone-200/80 bg-stone-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent font-serif font-bold text-sm">
                {conversation?.partnerAvatarUrl ? (
                  <img
                    src={conversation.partnerAvatarUrl}
                    alt={conversation.partnerName || 'Khán giả'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  (conversation?.partnerName || 'K')[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold font-serif text-ink truncate flex items-center gap-2">
                  <span>{conversation?.partnerName || 'Khán giả đặt làm nội dung'}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    Đã mở khóa
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 truncate">
                  {conversation?.topicTitle || topicTitle || 'Thương lượng kịch bản & lộ trình Milestone'}
                </DialogDescription>
              </div>
            </div>

            {onOpenRoadmap && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenRoadmap();
                }}
                className="h-8 px-3 text-xs rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold shrink-0 shadow-2xs flex items-center gap-1.5"
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>Lập lộ trình</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50/30">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
              <RefreshCw className="h-6 w-6 animate-spin text-accent" />
              <span>Đang kết nối phòng trò chuyện an toàn...</span>
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-accent flex items-center justify-between">
              <span>Không thể kết nối phòng chat. Vui lòng thử lại.</span>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs">
                Thử lại
              </Button>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Context Notice Banner */}
              <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <Radio className="h-3.5 w-3.5" />
                  <span>Quy tắc thương lượng bảo chứng Escrow:</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Hai bên thống nhất kịch bản, thời gian và số chặng Milestone tại đây. Sau khi chốt, Creator bấm &ldquo;Lập lộ trình&rdquo; để gửi bảng giá và các giai đoạn cho khách hàng ký quỹ.
                </p>
              </div>

              {/* Message List */}
              {localMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'
                    } space-y-1`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-words ${msg.sender === 'me'
                        ? 'bg-accent text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                      }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono px-1">
                    {msg.time}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-stone-200/80 bg-white flex items-center gap-2 shrink-0"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn trao đổi kịch bản, yêu cầu kỹ thuật..."
            className="flex-1 h-9 text-xs rounded-xl border-stone-300 focus:border-accent focus:ring-accent"
          />
          <Button
            type="submit"
            disabled={!inputText.trim()}
            className="h-9 px-4 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gửi</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

