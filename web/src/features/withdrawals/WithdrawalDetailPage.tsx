import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  CreditCard,
  FileCheck2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { DetailWorkbench } from '@/components/layout/DetailWorkbench';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkbenchSkeleton } from '@/components/common/LoadingSkeleton';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { formatDateTime, formatVND, maskIdentifier } from '@/utils/formatters';

export const WithdrawalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const withdrawalId = Number(id);

  // Reviewer checklist state
  const [bankMatched, setBankMatched] = useState(false);
  const [amountVerified, setAmountVerified] = useState(false);
  const [noDisputeFlag, setNoDisputeFlag] = useState(false);

  // Decision Modal State
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | null>(null);

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['admin-withdrawal-detail', withdrawalId],
    queryFn: () => withdrawalsApi.getWithdrawalDetail(withdrawalId),
    enabled: Boolean(withdrawalId),
  });

  const approveMutation = useMutation({
    mutationFn: () => withdrawalsApi.approveRequest(withdrawalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-detail', withdrawalId] });
      setModalType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => withdrawalsApi.rejectRequest(withdrawalId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-detail', withdrawalId] });
      setModalType(null);
    },
  });

  if (isLoading) {
    return <WorkbenchSkeleton />;
  }

  if (isError || !item) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-status-error-text mb-3" />
        <h2 className="font-serif text-lg font-bold text-ink mb-1">
          Không tìm thấy yêu cầu rút tiền
        </h2>
        <p className="text-xs text-muted mb-4">
          Yêu cầu rút tiền ID #{withdrawalId} không tồn tại hoặc đã xử lý xong.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/withdrawals')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isPending = item.status === 'PENDING';

  const handleDecisionSubmit = (reason?: string) => {
    if (modalType === 'APPROVE') {
      approveMutation.mutate();
    } else if (modalType === 'REJECT') {
      rejectMutation.mutate(reason || 'Yêu cầu không đáp ứng tiêu chuẩn đối soát rút tiền');
    }
  };

  // Main Content (65%)
  const mainContent = (
    <div className="space-y-6">
      {/* Request Amount & Wallet Details Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-base font-bold text-ink">
              Thông tin yêu cầu rút tiền
            </h3>
          </div>
          <span className="font-mono text-xs text-muted">Ví Creator ID #{item.walletId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-border bg-surface-subtle/50 p-4 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Số tiền yêu cầu rút
            </span>
            <span className="font-mono font-bold text-ink text-2xl block text-accent">
              {formatVND(item.amount)}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              * Số tiền này đã được đóng băng từ số dư khả dụng (available balance)
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle/50 p-4 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Mã giao dịch nội bộ
            </span>
            <span className="font-mono font-semibold text-ink text-sm block">
              WITHDRAW-REQ-#{item.id}
            </span>
            <div className="flex items-center gap-1.5 text-muted pt-2 text-[11px] font-mono">
              <Calendar className="h-3.5 w-3.5 text-border" />
              <span>Thời điểm tạo: {formatDateTime(item.requestedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Destination Card (Masked) */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-status-processing-text" />
            <h3 className="font-serif text-base font-bold text-ink">
              Tài khoản ngân hàng thụ hưởng (Bảo mật thông tin)
            </h3>
          </div>
          <span className="text-[11px] text-muted uppercase tracking-wider font-mono">
            Đã che số tài khoản
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-border bg-canvas">
            <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
              <Landmark className="h-3.5 w-3.5" />
              <span>Ngân hàng</span>
            </div>
            <p className="font-semibold text-ink text-sm">{item.bankName}</p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-canvas">
            <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Số tài khoản</span>
            </div>
            <p className="font-mono font-semibold text-ink text-sm">
              {maskIdentifier(item.accountNumber)}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-canvas">
            <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
              <User className="h-3.5 w-3.5" />
              <span>Chủ tài khoản</span>
            </div>
            <p className="font-semibold text-ink text-sm uppercase">
              {item.accountHolderName}
            </p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface-subtle p-3 text-xs text-muted leading-relaxed">
          <p className="font-semibold text-ink mb-1 text-[11px] uppercase tracking-wide">
            Chính sách đối soát và hoàn tiền:
          </p>
          Nếu yêu cầu này bị từ chối, số tiền {formatVND(item.amount)} sẽ được hệ thống tự động hoàn trả nguyên vẹn về số dư khả dụng trong ví của Nhà sáng tạo.
        </div>
      </div>
    </div>
  );

  // Inspector Content (35%)
  const inspectorContent = (
    <div className="space-y-5">
      {/* Reviewer Checklist */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Danh mục thẩm định của Điều hành viên
        </h4>
        <div className="space-y-2.5 pt-1">
          <Checkbox
            checked={bankMatched}
            onChange={(e) => setBankMatched(e.target.checked)}
            label="Tên chủ tài khoản ngân hàng khớp với hồ sơ định danh KYC"
          />

          <Checkbox
            checked={amountVerified}
            onChange={(e) => setAmountVerified(e.target.checked)}
            label="Số tiền rút hợp lệ, tuân thủ hạn mức giao dịch tối thiểu/tối đa"
          />

          <Checkbox
            checked={noDisputeFlag}
            onChange={(e) => setNoDisputeFlag(e.target.checked)}
            label="Tài khoản không có khiếu nại hoặc dấu hiệu gian lận vi phạm"
          />
        </div>
      </div>

      {/* Decision Metadata History */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Tiến trình yêu cầu
        </h4>

        <div className="flex justify-between py-1 border-b border-border">
          <span className="text-muted">Trạng thái:</span>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex justify-between py-1 border-b border-border font-mono">
          <span className="text-muted">Khởi tạo:</span>
          <span className="text-muted">{formatDateTime(item.requestedAt)}</span>
        </div>

        {item.processedAt && (
          <div className="flex justify-between py-1 border-b border-border font-mono">
            <span className="text-muted">Thời điểm xử lý:</span>
            <span className="text-muted">{formatDateTime(item.processedAt)}</span>
          </div>
        )}

        {item.failureReason && (
          <div className="pt-2">
            <span className="font-semibold text-status-error-text block mb-1">
              Lý do từ chối / lỗi:
            </span>
            <p className="rounded-md border border-status-error-text/30 bg-status-error-bg p-2.5 text-status-error-text leading-relaxed font-mono text-[11px]">
              {item.failureReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Bottom Action Bar (Mandatory Correction 1: Approve Request / Reject Request)
  const bottomBar = isPending ? (
    <>
      <div className="flex items-center gap-2 text-xs text-muted">
        <FileCheck2 className="h-4 w-4 text-status-pending-text" />
        <span>Xem xét và phê duyệt tính hợp lệ của yêu cầu rút tiền</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setModalType('REJECT')}
          className="border-status-error-text text-status-error-text hover:bg-status-error-bg"
        >
          <ShieldAlert className="mr-1.5 h-4 w-4" />
          Từ chối yêu cầu
        </Button>
        <Button
          variant="primary"
          onClick={() => setModalType('APPROVE')}
          className="bg-status-success-text hover:bg-status-success-text/90"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Chấp thuận yêu cầu
        </Button>
      </div>
    </>
  ) : (
    <div className="flex items-center justify-between w-full text-xs text-muted">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-status-success-text" />
        <span>Yêu cầu rút tiền này đã được xử lý</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/admin/withdrawals')}>
        Quay lại hàng đợi
      </Button>
    </div>
  );

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending;

  return (
    <>
      <DetailWorkbench
        title={`Yêu cầu rút tiền #${item.id}`}
        backUrl="/admin/withdrawals"
        backLabel="Hàng đợi rút tiền"
        badge={<StatusBadge status={item.status} />}
        subtitle={`Ví Creator ID #${item.walletId} • Số tiền: ${formatVND(item.amount)} • Thụ hưởng: ${item.bankName}`}
        mainContent={mainContent}
        inspectorContent={inspectorContent}
        bottomBar={bottomBar}
      />

      <ConfirmModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'APPROVE'
            ? 'Chấp thuận yêu cầu rút tiền'
            : 'Từ chối yêu cầu rút tiền'
        }
        description={
          modalType === 'APPROVE'
            ? `Yêu cầu rút số tiền ${formatVND(item.amount)} sẽ được chấp thuận và chuyển sang hàng đợi xử lý chi trả.`
            : `Yêu cầu rút tiền sẽ bị từ chối. Số tiền ${formatVND(item.amount)} sẽ được tự động hoàn trả vào ví Creator.`
        }
        confirmText={modalType === 'APPROVE' ? 'Xác nhận chấp thuận' : 'Xác nhận từ chối'}
        variant={modalType === 'APPROVE' ? 'primary' : 'destructive'}
        requireReason={modalType === 'REJECT'}
        reasonPlaceholder="Nhập lý do từ chối yêu cầu rút tiền..."
        isLoading={isSubmitting}
        onConfirm={(reason?: string) => handleDecisionSubmit(reason)}
      />
    </>
  );
};
