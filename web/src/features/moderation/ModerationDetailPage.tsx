import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Video,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DetailWorkbench } from '@/components/layout/DetailWorkbench';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AiShieldBadge } from './components/AiShieldBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkbenchSkeleton } from '@/components/common/LoadingSkeleton';
import { moderationApi } from '@/services/api/moderation';
import { formatDateTime, formatDuration } from '@/utils/formatters';

export const ModerationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reviewId = Number(id);

  // Checklist state
  const [historyCheck, setHistoryCheck] = useState(false);
  const [copyrightCheck, setCopyrightCheck] = useState(false);
  const [standardsCheck, setStandardsCheck] = useState(false);

  // Decision Modal State
  const [modalType, setModalType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-moderation-detail', reviewId],
    queryFn: () => moderationApi.getReviewDetail(reviewId),
    enabled: Boolean(reviewId),
  });

  const decisionMutation = useMutation({
    mutationFn: (variables: { decision: 'APPROVED' | 'REJECTED'; reason: string }) =>
      moderationApi.submitDecision(reviewId, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-detail', reviewId] });
      setModalType(null);
    },
  });

  const item = data?.data;

  if (isLoading) {
    return <WorkbenchSkeleton />;
  }

  if (isError || !item) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-status-error-text mb-3" />
        <h2 className="font-serif text-lg font-bold text-ink mb-1">
          Không tìm thấy hồ sơ kiểm duyệt
        </h2>
        <p className="text-xs text-muted mb-4">
          Hồ sơ kiểm duyệt ID #{reviewId} không tồn tại hoặc đã bị xóa.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/moderation')} className="min-h-[44px]">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isPending = item.decision === 'PENDING';

  const handleDecisionSubmit = (reason: string) => {
    if (!modalType) return;
    decisionMutation.mutate({
      decision: modalType,
      reason: reason || (modalType === 'APPROVED' ? 'Đã thẩm định phù hợp xuất bản' : ''),
    });
  };

  // Main Content Column
  const mainContent = (
    <div className="space-y-6">
      {/* Media Player Card */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border bg-surface-subtle/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Video className="h-4 w-4 text-muted" />
            <span>Nội dung Video / Podcast phát hành</span>
          </div>
          {item.durationSeconds && (
            <span className="font-mono text-xs text-muted">
              {formatDuration(item.durationSeconds)}
            </span>
          )}
        </div>

        <div className="p-4 bg-ink/5">
          {item.fileUrl || item.optimizedUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <video
                src={item.optimizedUrl || item.fileUrl}
                controls
                preload="metadata"
                className="h-full w-full object-contain"
              >
                Trình duyệt không hỗ trợ phát video này.
              </video>
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-subtle/40 text-muted">
              <Video className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">Không tìm thấy luồng phát media khả dụng</p>
              <p className="text-[11px] text-muted/80">Tệp video chưa được đính kèm hoặc đang xử lý mã hóa</p>
            </div>
          )}
        </div>

        {/* Video metadata */}
        <div className="p-5 space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink leading-snug">
            {item.title}
          </h2>
          <p className="text-sm text-ink/80 whitespace-pre-line leading-relaxed">
            {item.description || 'Không có mô tả chi tiết từ tác giả.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Kênh: <strong>{item.channelName || 'Không có'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>Gửi lúc: {formatDateTime(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Shield Qualitative Analysis & Transcript Citations */}
      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-base font-bold text-ink">
              Báo cáo thẩm định AI Shield & Trích dẫn
            </h3>
          </div>
          <span className="text-xs text-muted">Hỗ trợ gợi ý kiểm duyệt</span>
        </div>

        {item.markdownContent ? (
          <div className="prose prose-sm max-w-none text-ink/90 leading-relaxed font-sans bg-canvas/60 p-4 rounded-lg border border-border overflow-x-auto whitespace-pre-line">
            {item.markdownContent}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface-subtle/30 p-6 text-center text-xs text-muted">
            Không có báo cáo phân tích Markdown chi tiết từ hệ thống MarkItDown cho bản ghi này.
          </div>
        )}
      </div>
    </div>
  );

  // Inspector Column
  const inspectorContent = (
    <div className="space-y-5">
      {/* Qualitative AI Shield Finding Card */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Thẩm định AI Shield
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink font-medium">Phân tầng:</span>
          <AiShieldBadge tier={item.aiShieldTier} label={item.aiShieldTierLabel} />
        </div>

        {item.aiShieldReason && (
          <div className="rounded-md border border-border bg-surface-subtle p-3 text-xs leading-relaxed text-ink/90">
            <p className="font-semibold text-ink mb-1 text-[11px] uppercase tracking-wide">
              Ghi chú của hệ thống AI:
            </p>
            {item.aiShieldReason}
          </div>
        )}

        <p className="text-[11px] text-muted italic">
          * Đánh giá AI Shield chỉ mang tính chất tham khảo. Quản trị viên chịu trách nhiệm pháp lý và học thuật cho quyết định cuối cùng.
        </p>
      </div>

      {/* Human Review Checklist */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Danh mục kiểm tra của Điều hành viên
        </h4>
        <div className="space-y-2.5 pt-1">
          <Checkbox
            checked={historyCheck}
            onChange={(e) => setHistoryCheck(e.target.checked)}
            label="Tính chuẩn xác của tư liệu lịch sử và nhân vật được đề cập"
          />

          <Checkbox
            checked={copyrightCheck}
            onChange={(e) => setCopyrightCheck(e.target.checked)}
            label="Bản quyền hình ảnh, âm thanh, giọng đọc thuyết minh hợp lệ"
          />

          <Checkbox
            checked={standardsCheck}
            onChange={(e) => setStandardsCheck(e.target.checked)}
            label="Tuân thủ chuẩn mực cộng đồng và pháp luật Việt Nam"
          />
        </div>
      </div>

      {/* Decision Metadata History */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Thông tin quyết định
        </h4>

        <div className="flex justify-between py-1 border-b border-border">
          <span className="text-muted">Trạng thái:</span>
          <StatusBadge status={item.decision} />
        </div>

        {item.moderatorEmail && (
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-muted">Người duyệt:</span>
            <span className="font-mono text-ink font-medium">{item.moderatorEmail}</span>
          </div>
        )}

        {item.reviewedAt && (
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-muted">Thời điểm:</span>
            <span className="font-mono text-muted">{formatDateTime(item.reviewedAt)}</span>
          </div>
        )}

        {item.adminReason && (
          <div className="pt-2">
            <span className="font-semibold text-ink block mb-1">Ý kiến thẩm định:</span>
            <p className="rounded-md border border-border bg-surface-subtle p-2.5 text-muted leading-relaxed font-mono text-[11px]">
              {item.adminReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Persistent Decision Bottom Bar
  const bottomBar = isPending ? (
    <>
      <div className="flex items-center gap-2 text-xs text-muted">
        <AlertTriangle className="h-4 w-4 text-status-pending-text" />
        <span>Vui lòng kiểm tra kỹ nội dung trước khi ban hành quyết định</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setModalType('REJECTED')}
          className="border-status-error-text/40 text-status-error-text hover:bg-status-error-bg min-h-[44px] px-4"
        >
          <ShieldAlert className="mr-1.5 h-4 w-4" />
          Từ chối nội dung
        </Button>
        <Button
          variant="primary"
          onClick={() => setModalType('APPROVED')}
          className="min-h-[44px] px-5"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Phê duyệt xuất bản
        </Button>
      </div>
    </>
  ) : (
    <div className="flex items-center justify-between w-full text-xs text-muted">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-status-success-text" />
        <span>Hồ sơ này đã có kết luận phê duyệt</span>
      </div>
      <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/admin/moderation')}>
        Quay lại hàng đợi
      </Button>
    </div>
  );

  return (
    <>
      <DetailWorkbench
        title={item.title}
        backUrl="/admin/moderation"
        backLabel="Hàng đợi kiểm duyệt"
        badge={<StatusBadge status={item.decision} />}
        subtitle={`ID #${item.reviewId} • Kênh: ${item.channelName || 'N/A'} • Tác giả: ${item.creatorEmail}`}
        mainContent={mainContent}
        inspectorContent={inspectorContent}
        bottomBar={bottomBar}
      />

      {/* Decision Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'APPROVED'
            ? 'Xác nhận phê duyệt xuất bản video'
            : 'Từ chối duyệt nội dung video'
        }
        description={
          modalType === 'APPROVED'
            ? 'Video sẽ được chuyển sang trạng thái CÔNG KHAI và hiển thị tới khán giả nền tảng Sử Ký.'
            : 'Nội dung sẽ bị từ chối. Creator sẽ nhận được thông báo kèm lý do chi tiết để chỉnh sửa và nộp lại.'
        }
        confirmText={modalType === 'APPROVED' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        variant={modalType === 'APPROVED' ? 'primary' : 'destructive'}
        requireReason={modalType === 'REJECTED'}
        reasonPlaceholder={
          modalType === 'REJECTED'
            ? 'Nêu rõ sai sót tư liệu lịch sử hoặc vi phạm quy định cộng đồng...'
            : 'Ghi chú kiểm duyệt nếu cần...'
        }
        isLoading={decisionMutation.isPending}
        onConfirm={(reason?: string) => handleDecisionSubmit(reason || '')}
      />
    </>
  );
};
