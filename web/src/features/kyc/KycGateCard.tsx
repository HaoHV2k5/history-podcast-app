import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KycGateStatus } from './useKycGate';

interface KycGateCardProps {
  status: KycGateStatus;
  rejectionReason?: string;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export const KycGateCard: React.FC<KycGateCardProps> = ({
  status,
  rejectionReason,
  errorMessage,
  onRetry,
  className = '',
}) => {
  const navigate = useNavigate();

  if (status === 'APPROVED') {
    return null;
  }

  // 1. Error state
  if (status === 'ERROR') {
    return (
      <div
        className={`rounded-xl border border-status-error-text/30 bg-surface p-6 shadow-xs ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-status-error-bg text-status-error-text">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-serif text-lg font-bold text-ink">
              Không thể kiểm tra điều kiện định danh
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {errorMessage || 'Đã xảy ra lỗi khi kết nối với máy chủ để xác thực quyền tạo kênh. Vui lòng kiểm tra kết nối mạng và thử lại.'}
            </p>
            {onRetry && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Thử lại</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Pending approval state
  if (status === 'PENDING') {
    return (
      <div
        className={`rounded-xl border border-amber-300/40 bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden ${className}`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-500/20">
                <Clock className="h-3 w-3" />
                Hồ sơ đang chờ phê duyệt
              </span>
              <span className="text-xs text-muted font-mono">KYC PENDING</span>
            </div>

            <h3 className="font-serif text-xl font-bold tracking-tight text-ink">
              Hồ sơ định danh tác giả đang được thẩm định
            </h3>

            <p className="text-sm text-muted leading-relaxed max-w-2xl">
              Hồ sơ Nhà sáng tạo của bạn đã được ghi nhận và đang trong quá trình xét duyệt sử liệu và thông tin thụ hưởng bởi Ban Biên tập Sử Ký (thời gian xử lý dự kiến: 24–48 giờ làm việc). Tính năng khởi tạo kênh podcast sẽ được kích hoạt ngay sau khi hồ sơ được chấp thuận.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={() => navigate('/creator/kyc')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Xem chi tiết hồ sơ đã nộp</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Rejected state
  if (status === 'REJECTED') {
    return (
      <div
        className={`rounded-xl border border-status-error-text/30 bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden ${className}`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-status-error-text" />
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-status-error-bg text-status-error-text border border-status-error-text/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-error-bg px-2.5 py-0.5 text-xs font-semibold text-status-error-text border border-status-error-text/20">
                <AlertCircle className="h-3 w-3" />
                Hồ sơ bị từ chối phê duyệt
              </span>
              <span className="text-xs text-muted font-mono">KYC REJECTED</span>
            </div>

            <h3 className="font-serif text-xl font-bold tracking-tight text-ink">
              Cần cập nhật và nộp lại hồ sơ định danh
            </h3>

            <p className="text-sm text-muted leading-relaxed max-w-2xl">
              Hồ sơ đăng ký Nhà sáng tạo của bạn chưa đáp ứng đủ tiêu chí xét duyệt của Sử Ký. Bạn cần điều chỉnh các thông tin chưa chính xác và nộp lại để được cấp quyền mở kênh.
            </p>

            {rejectionReason && (
              <div className="rounded-lg border border-status-error-text/20 bg-status-error-bg/40 p-4 max-w-2xl space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-status-error-text block">
                  Lý do từ chối từ Ban Biên tập:
                </span>
                <p className="text-sm font-medium text-ink italic">
                  "{rejectionReason}"
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="default"
                onClick={() => navigate('/creator/kyc')}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Chỉnh sửa & Nộp lại hồ sơ KYC</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. No profile / Draft state
  return (
    <div
      className={`rounded-xl border border-accent/20 bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/20">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
              <Lock className="h-3 w-3" />
              Yêu cầu hoàn tất định danh tác giả
            </span>
            <span className="text-xs text-muted font-mono">KYC GATE</span>
          </div>

          <h3 className="font-serif text-xl font-bold tracking-tight text-ink">
            Xác thực danh tính trước khi khởi tạo Kênh Podcast
          </h3>

          <p className="text-sm text-muted leading-relaxed max-w-2xl">
            Để đảm bảo tính xác thực của các tác phẩm âm thanh lịch sử và bảo vệ quyền tác giả, Sử Ký yêu cầu tất cả Nhà sáng tạo hoàn tất thủ tục định danh (KYC) gồm xác thực email và tài khoản ngân hàng trước khi thiết lập kênh podcast.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="default"
              onClick={() => navigate('/creator/kyc')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>Tiến hành xác thực danh tính (KYC)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
