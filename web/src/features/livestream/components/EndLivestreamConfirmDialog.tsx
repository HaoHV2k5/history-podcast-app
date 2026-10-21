import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, StopCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { livestreamApi } from '@/services/api/livestream';
import { LivestreamSession } from '@/types/livestream';
import { interpretLivestreamError, validateEndSessionTransition } from '../livestreamLogic';
import { useAuthStore } from '@/store/authStore';

interface EndLivestreamConfirmDialogProps {
  session: LivestreamSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSession?: LivestreamSession) => void;
}

export const EndLivestreamConfirmDialog: React.FC<EndLivestreamConfirmDialogProps> = ({
  session,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const endMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await livestreamApi.endSession(sessionId);
      return res.data;
    },
    onSuccess: (updatedSession) => {
      if (session) {
        queryClient.setQueryData(['creator-livestream-detail', session.id], {
          data: updatedSession,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['creator-livestreams'] });
      setErrorMsg(null);
      onSuccess(updatedSession);
      onClose();
    },
    onError: (err: unknown) => {
      const errObj = err as { errorCode?: string; message?: string };
      const msg = interpretLivestreamError(
        errObj.errorCode,
        errObj.message || 'Không thể kết thúc phiên phát trực tiếp. Vui lòng thử lại.'
      );
      setErrorMsg(msg);
    },
  });

  const handleConfirm = () => {
    if (!session) return;
    setErrorMsg(null);

    const validation = validateEndSessionTransition(session, user?.id);
    if (!validation.canEnd) {
      setErrorMsg(validation.reason || 'Không đủ điều kiện kết thúc phiên phát sóng.');
      return;
    }

    endMutation.mutate(session.id);
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !endMutation.isPending && onClose()}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Kết thúc phiên phát sóng?</DialogTitle>
              <DialogDescription>
                Hành động này sẽ đóng phòng phát sóng và ngắt luồng video trực tiếp.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-ink/80">
          <div className="rounded-lg border border-border bg-surface-subtle/50 p-3">
            <p className="font-semibold text-ink line-clamp-1">{session.title}</p>
            <p className="mt-0.5 text-[11px] text-muted">Kênh: {session.channelName}</p>
          </div>

          <p className="leading-relaxed">
            Khán giả đang theo dõi sẽ không thể tiếp tục gửi tin nhắn trò chuyện hoặc xem luồng phát. Sau khi kết thúc, phiên phát sóng sẽ chuyển sang trạng thái{' '}
            <strong className="text-muted font-bold">Đã kết thúc</strong> và lưu vào lịch sử của kênh.
          </p>

          {errorMsg && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={endMutation.isPending}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={endMutation.isPending}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {endMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang kết thúc...</span>
              </>
            ) : (
              <>
                <StopCircle className="h-4 w-4" />
                <span>Xác nhận kết thúc</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
