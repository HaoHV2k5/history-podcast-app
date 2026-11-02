import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  ShieldCheck,
  RefreshCw,
  Radio,
  FileCheck,
  ImagePlus,
  Loader2,
  X,
  AlertCircle,
  MessageSquare,
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
import { useFirestoreChat } from '../hooks/useFirestoreChat';

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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
  const fallbackConvId = commissionId
    ? `hire_request_${commissionId}`
    : contractId
    ? `contract_${contractId}`
    : null;

  const {
    messages,
    isLoadingMessages,
    isSending,
    isUploadingImage,
    chatError,
    setChatError,
    sendMessage,
    isOwnMessage,
  } = useFirestoreChat({
    conversationId: conversation?.conversationId,
    fallbackConversationId: fallbackConvId,
    enabled: isOpen && Boolean(commissionId || contractId),
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isOpen]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setChatError('Vui lòng chỉ chọn tệp hình ảnh (.jpg, .png, .webp)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setChatError('Kích thước ảnh đính kèm tối đa là 10MB');
      return;
    }

    setChatError(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelectedImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImageFile) || isSending) return;

    const textToSend = inputText;
    const fileToSend = selectedImageFile;

    const ok = await sendMessage(textToSend, fileToSend);
    if (ok) {
      setInputText('');
      handleClearSelectedImage();
    }
  };

  return (
    <>
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
                    {conversation?.topicTitle ||
                      topicTitle ||
                      'Thương lượng kịch bản & lộ trình Milestone'}
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
                  className="h-8 px-3 text-xs rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold shrink-0 shadow-2xs flex items-center gap-1.5 active:scale-[0.97] transition-transform"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Lập lộ trình</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50/30">
            {(isLoading || (isLoadingMessages && messages.length === 0)) && (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                <RefreshCw className="h-6 w-6 animate-spin text-accent" />
                <span>Đang đồng bộ phòng trò chuyện từ Firebase Cloud...</span>
              </div>
            )}

            {isError && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-accent flex items-center justify-between">
                <span>Không thể xác thực phòng chat. Vui lòng thử lại.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="h-7 text-xs"
                >
                  Thử lại
                </Button>
              </div>
            )}

            {chatError && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{chatError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatError(null)}
                  className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
                  aria-label="Đóng thông báo lỗi"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
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

                {/* Empty State */}
                {!isLoadingMessages && messages.length === 0 && (
                  <div className="py-12 text-center space-y-2 text-stone-400">
                    <div className="h-10 w-10 rounded-full bg-stone-100 border border-stone-200/70 flex items-center justify-center mx-auto text-stone-400">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-stone-600">
                      Chưa có tin nhắn nào trong phòng thương lượng này
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Hãy gửi lời chào hoặc đính kèm ảnh phác thảo kịch bản để bắt đầu trao đổi với khán giả.
                    </p>
                  </div>
                )}

                {/* Message List */}
                {messages.map((msg) => {
                  const mine = isOwnMessage(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        mine ? 'items-end' : 'items-start'
                      } space-y-1`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-words space-y-2 ${
                          mine
                            ? 'bg-accent text-white rounded-br-xs'
                            : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setLightboxImageUrl(msg.imageUrl)}
                            className="block overflow-hidden rounded-xl border border-black/10 hover:opacity-95 transition-opacity cursor-pointer"
                            title="Bấm để phóng to ảnh"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Ảnh đính kèm trong chat"
                              loading="lazy"
                              className="max-h-56 w-auto object-cover rounded-xl"
                            />
                          </button>
                        )}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono px-1">
                        {msg.timeFormatted}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Selected Image Preview Strip */}
          {imagePreviewUrl && (
            <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-stone-300 bg-white shrink-0">
                  <img
                    src={imagePreviewUrl}
                    alt="Xem trước ảnh gửi"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-800 truncate">
                    {selectedImageFile?.name || 'Ảnh đính kèm'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {isUploadingImage
                      ? 'Đang tải ảnh lên Cloudinary...'
                      : 'Sẵn sàng gửi vào phòng chat'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedImage}
                disabled={isSending}
                aria-label="Hủy ảnh đính kèm"
                className="h-7 w-7 rounded-lg hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-stone-200/80 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleSelectImage}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              aria-label="Đính kèm hình ảnh"
              title="Gửi ảnh minh họa / kịch bản"
              className="h-9 w-9 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-600 hover:text-accent flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-[0.97] disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" />
            </button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              placeholder="Nhập tin nhắn trao đổi kịch bản, yêu cầu kỹ thuật..."
              className="flex-1 h-9 text-xs rounded-xl border-stone-300 focus:border-accent focus:ring-accent"
            />
            <Button
              type="submit"
              disabled={(!inputText.trim() && !selectedImageFile) || isSending}
              className="h-9 px-4 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-[0.97]"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{isUploadingImage ? 'Đang tải...' : 'Gửi'}</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Modal */}
      {lightboxImageUrl && (
        <Dialog
          open={Boolean(lightboxImageUrl)}
          onOpenChange={(open) => !open && setLightboxImageUrl(null)}
        >
          <DialogContent className="max-w-4xl p-2 bg-stone-950/95 border border-stone-800 rounded-2xl flex items-center justify-center overflow-hidden">
            <DialogTitle className="sr-only">Xem ảnh đính kèm phóng to</DialogTitle>
            <DialogDescription className="sr-only">
              Hình ảnh đính kèm trong cuộc trò chuyện hợp đồng
            </DialogDescription>
            <img
              src={lightboxImageUrl}
              alt="Ảnh phóng to"
              className="max-h-[82vh] max-w-full object-contain rounded-xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
