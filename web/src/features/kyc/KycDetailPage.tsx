import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { DetailWorkbench } from '@/components/layout/DetailWorkbench';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkbenchSkeleton } from '@/components/common/LoadingSkeleton';
import { kycApi } from '@/services/api/kyc';
import { formatDateTime, maskPhone } from '@/utils/formatters';

export const KycDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const kycId = Number(id);

  // Reviewer checklist state
  const [identityVerified, setIdentityVerified] = useState(false);
  const [contactVerified, setContactVerified] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Decision Modal
  const [modalType, setModalType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['admin-kyc-detail', kycId],
    queryFn: () => kycApi.getKycDetail(kycId),
    enabled: Boolean(kycId),
  });

  const statusMutation = useMutation({
    mutationFn: (variables: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      kycApi.updateKycStatus(kycId, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-detail', kycId] });
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
          Không tìm thấy hồ sơ KYC
        </h2>
        <p className="text-xs text-muted mb-4">
          Hồ sơ định danh ID #{kycId} không tồn tại hoặc đã được xử lý.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/kyc')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isPending = item.status === 'PENDING';

  const handleDecisionSubmit = (reason?: string) => {
    if (!modalType) return;
    statusMutation.mutate({
      status: modalType,
      rejectionReason: reason || undefined,
    });
  };

  // Main Content (65%)
  const mainContent = (
    <div className="space-y-6">
      {/* Identity Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-base font-bold text-ink">
              Thông tin định danh ứng viên
            </h3>
          </div>
          <span className="text-xs text-muted font-mono">User ID #{item.userId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-border bg-surface-subtle/50 p-3.5 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Họ và tên đầy đủ
            </span>
            <span className="font-medium text-ink text-sm block">
              {item.fullName || 'Chưa cung cấp'}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle/50 p-3.5 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Email tài khoản đăng nhập
            </span>
            <span className="font-mono text-ink text-sm block">
              {item.userEmail}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle/50 p-3.5 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Email liên hệ đã xác thực
            </span>
            <div className="flex items-center gap-1.5 text-ink text-sm">
              <Mail className="h-4 w-4 text-muted" />
              <span className="font-mono">{item.contactEmail || item.userEmail}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle/50 p-3.5 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
              Số điện thoại đã bảo mật
            </span>
            <div className="flex items-center gap-1.5 text-ink text-sm">
              <Phone className="h-4 w-4 text-muted" />
              <span className="font-mono">{item.phone ? maskPhone(item.phone) : 'Chưa liên kết'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification OTP Metadata */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-status-success-text" />
            <h3 className="font-serif text-base font-bold text-ink">
              Trạng thái xác thực bảo mật hai lớp
            </h3>
          </div>
          <span className="text-xs text-status-success-text font-semibold uppercase tracking-wider">
            Đã xác thực OTP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-border bg-canvas">
            <span className="text-muted block text-[11px] mb-1">Phương thức xác minh</span>
            <p className="font-semibold text-ink">
              {item.verificationMethod === 'PHONE' ? 'OTP Số điện thoại (Firebase)' : 'OTP Hộp thư Email (Brevo HTTPS)'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-canvas">
            <span className="text-muted block text-[11px] mb-1">Thời điểm hoàn tất OTP</span>
            <p className="font-mono text-ink">
              {item.otpVerifiedAt ? formatDateTime(item.otpVerifiedAt) : 'Chưa ghi nhận'}
            </p>
          </div>
        </div>
      </div>

      {/* Creator Profile / Bio */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-base font-bold text-ink">
              Tiểu sử & Hồ sơ sáng tạo
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
              Đường dẫn Portfolio / Kênh tham chiếu:
            </span>
            {item.portfolioUrl ? (
              <a
                href={item.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-accent hover:underline flex items-center gap-1.5 break-all"
              >
                <span>{item.portfolioUrl}</span>
              </a>
            ) : (
              <span className="text-muted italic">Không cung cấp liên kết ngoài</span>
            )}
          </div>

          <div>
            <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
              Tiểu sử giới thiệu bản thân:
            </span>
            <p className="rounded-md border border-border bg-surface-subtle p-3 text-ink/90 whitespace-pre-line leading-relaxed">
              {item.bio || 'Chưa cung cấp thông tin tiểu sử.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Inspector Content (35%)
  const inspectorContent = (
    <div className="space-y-5">
      {/* Role Elevation Notice (Mandatory Correction 3) */}
      <div className="rounded-xl border border-accent/30 bg-accent-soft p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-accent font-semibold text-xs">
          <Sparkles className="h-4 w-4" />
          <span>Cơ chế tự động nâng cấp vai trò</span>
        </div>
        <p className="text-xs text-ink/90 leading-relaxed">
          Khi phê duyệt hồ sơ này, hệ thống máy chủ Sử Ký sẽ tự động gắn vai trò{' '}
          <strong className="font-mono text-accent">CREATOR</strong> cho tài khoản. Người dùng sẽ có quyền truy cập Creator Studio và xuất bản video.
        </p>
      </div>

      {/* Reviewer Checklist */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Danh mục kiểm tra của Điều hành viên
        </h4>
        <div className="space-y-2.5 pt-1">
          <Checkbox
            checked={identityVerified}
            onChange={(e) => setIdentityVerified(e.target.checked)}
            label="Họ tên và thông tin liên hệ nhất quán, rõ ràng"
          />

          <Checkbox
            checked={contactVerified}
            onChange={(e) => setContactVerified(e.target.checked)}
            label="Email/Số điện thoại đã hoàn tất xác thực OTP hợp lệ"
          />

          <Checkbox
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
            label="Hồ sơ và mục đích sáng tạo phù hợp quy chuẩn Sử Ký"
          />
        </div>
      </div>

      {/* Decision Metadata History */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Tiến trình hồ sơ
        </h4>

        <div className="flex justify-between py-1 border-b border-border">
          <span className="text-muted">Trạng thái:</span>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex justify-between py-1 border-b border-border font-mono">
          <span className="text-muted">Ngày gửi:</span>
          <span className="text-muted">{formatDateTime(item.createdAt)}</span>
        </div>

        {item.updatedAt && (
          <div className="flex justify-between py-1 border-b border-border font-mono">
            <span className="text-muted">Cập nhật:</span>
            <span className="text-muted">{formatDateTime(item.updatedAt)}</span>
          </div>
        )}

        {item.rejectionReason && (
          <div className="pt-2">
            <span className="font-semibold text-status-error-text block mb-1">
              Lý do từ chối trước đó:
            </span>
            <p className="rounded-md border border-status-error-text/30 bg-status-error-bg p-2.5 text-status-error-text leading-relaxed font-mono text-[11px]">
              {item.rejectionReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Bottom Action Bar
  const bottomBar = isPending ? (
    <>
      <div className="flex items-center gap-2 text-xs text-muted">
        <FileCheck2 className="h-4 w-4 text-status-pending-text" />
        <span>Vui lòng hoàn tất kiểm tra hồ sơ trước khi đưa ra quyết định</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setModalType('REJECTED')}
          className="border-status-error-text text-status-error-text hover:bg-status-error-bg"
        >
          <ShieldAlert className="mr-1.5 h-4 w-4" />
          Từ chối hồ sơ
        </Button>
        <Button
          variant="primary"
          onClick={() => setModalType('APPROVED')}
          className="bg-status-success-text hover:bg-status-success-text/90"
        >
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Phê duyệt làm Creator
        </Button>
      </div>
    </>
  ) : (
    <div className="flex items-center justify-between w-full text-xs text-muted">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-status-success-text" />
        <span>Hồ sơ này đã có kết luận phê duyệt</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/admin/kyc')}>
        Quay lại hàng đợi
      </Button>
    </div>
  );

  return (
    <>
      <DetailWorkbench
        title={item.fullName || `Hồ sơ KYC #${item.id}`}
        backUrl="/admin/kyc"
        backLabel="Hàng đợi KYC"
        badge={<StatusBadge status={item.status} />}
        subtitle={`Hồ sơ ID #${item.id} • User ID #${item.userId} • Email: ${item.userEmail}`}
        mainContent={mainContent}
        inspectorContent={inspectorContent}
        bottomBar={bottomBar}
      />

      <ConfirmModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'APPROVED'
            ? 'Xác nhận phê duyệt hồ sơ Creator'
            : 'Từ chối phê duyệt hồ sơ KYC'
        }
        description={
          modalType === 'APPROVED'
            ? 'Tài khoản người dùng sẽ được nâng cấp vai trò CREATOR tự động trong hệ thống và có quyền sáng tạo nội dung.'
            : 'Hồ sơ KYC sẽ bị từ chối. Vui lòng cung cấp lý do rõ ràng để người dùng nắm được thông tin.'
        }
        confirmText={modalType === 'APPROVED' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        variant={modalType === 'APPROVED' ? 'primary' : 'destructive'}
        requireReason={modalType === 'REJECTED'}
        reasonPlaceholder="Nhập lý do từ chối hồ sơ định danh..."
        isLoading={statusMutation.isPending}
        onConfirm={(reason?: string) => handleDecisionSubmit(reason)}
      />
    </>
  );
};
