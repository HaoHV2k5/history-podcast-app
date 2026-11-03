import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Globe,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { KycProfile } from '../../../types/kyc';
import {
  getInitials,
  getAvatarColor,
  getVerificationMethodBadge,
  getKycStatusBadgeConfig,
  formatKycDateTime,
  formatPhoneSpaced,
} from '../kycLogic';
import { cn } from '@/utils/cn';

interface AdminKycDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: KycProfile | null;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  onOpenWorkbench?: (id: number) => void;
  isSubmitting?: boolean;
}

const PREDEFINED_REJECTION_REASONS = [
  'Thông tin họ tên và số điện thoại không khớp',
  'Tài khoản thụ hưởng ngân hàng không chính chủ',
  'Liên hệ email/SĐT không nhận được phản hồi xác minh',
  'Đường dẫn portfolio/kênh tham chiếu không hợp lệ',
  'Chưa đáp ứng đủ tiêu chuẩn nội dung và quy chuẩn Sử Ký',
];

export const AdminKycDetailModal: React.FC<AdminKycDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  onOpenWorkbench,
  isSubmitting,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isTransitioningToDetail, setIsTransitioningToDetail] = useState(false);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showFullBank, setShowFullBank] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Smooth entrance & exit lifecycle
  useEffect(() => {
    if (isOpen) {
      const timer = requestAnimationFrame(() => setIsMounted(true));
      return () => cancelAnimationFrame(timer);
    } else {
      setIsMounted(false);
      setIsTransitioningToDetail(false);
      setShowRejectForm(false);
      setRejectionReason('');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const initials = getInitials(item.fullName || item.userEmail);
  const palette = getAvatarColor(item.fullName || item.userEmail);
  const methodBadge = getVerificationMethodBadge(item.verificationMethod);
  const statusBadge = getKycStatusBadgeConfig(item.status);
  const isPending = item.status === 'PENDING';

  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(item.id, rejectionReason.trim());
    setShowRejectForm(false);
    setRejectionReason('');
  };

  // Gentle transition to standalone detail workbench page
  const handleOpenWorkbench = () => {
    if (!item) return;
    setIsTransitioningToDetail(true);
    if ('startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        onClose();
        if (onOpenWorkbench) onOpenWorkbench(item.id);
      });
    } else {
      setTimeout(() => {
        onClose();
        if (onOpenWorkbench) onOpenWorkbench(item.id);
      }, 200);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto transition-all duration-300 ease-out select-none',
        isMounted && !isTransitioningToDetail
          ? 'bg-black/60 backdrop-blur-xs opacity-100'
          : 'bg-black/0 opacity-0 pointer-events-none'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Card with Apple-grade smooth spring physics curve */}
      <div
        className={cn(
          'relative z-10 w-full max-w-4xl overflow-hidden rounded-[24px] border border-[#E0DDD7] bg-[#FAF8F5] shadow-2xl flex flex-col max-h-[92vh] select-none transition-all duration-350',
          isMounted && !isTransitioningToDetail
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-[0.96] translate-y-3'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Authentic Watercolor Pagoda Backdrop matching Mockup */}
        <div className="relative overflow-hidden border-b border-[#EAE6DF] bg-white px-6 sm:px-8 py-5 shrink-0">
          {/* Authentic red watercolor Pagoda & Pine Trees backdrop */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 right-[20px] sm:right-[40px] w-[340px] sm:w-[420px] bg-contain bg-right-bottom bg-no-repeat select-none z-0 hidden sm:block opacity-90"
            style={{
              backgroundImage: "url('/assets/studio/admin-moderation-modal-pagoda.png')",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-base border shadow-2xs ${palette.bg} ${palette.text} ${palette.border}`}
              >
                {initials}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h2
                    id="kyc-modal-title"
                    className="font-serif text-lg sm:text-xl font-bold text-[#1C1917] tracking-tight"
                  >
                    {item.fullName || 'Hồ sơ KYC'}
                  </h2>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                      statusBadge.bgColor,
                      statusBadge.textColor,
                      statusBadge.borderColor
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusBadge.dotColor)} />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#78716C] font-mono mt-0.5">
                  <span>User ID: #{String(item.userId).padStart(3, '0')}</span>
                  <span className="h-3 w-px bg-[#E2DCD5]" aria-hidden="true" />
                  <span>Hồ sơ #{item.id}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="rounded-xl p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs scrollbar-thin">
          {/* 1. Elevation Notice matching Mockup */}
          <div className="rounded-2xl border border-[#991B1B]/20 bg-[#FFF8F8] p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-rose-200 text-[#991B1B] shadow-2xs mt-0.5">
              <Sparkles className="h-4 w-4 text-[#991B1B]" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-[#991B1B] text-xs sm:text-[13px] uppercase tracking-wider block">
                Cơ chế phân quyền Nhà sáng tạo (Creator)
              </span>
              <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                Khi phê duyệt, tài khoản sẽ được hệ thống tự động gán quyền{' '}
                <strong className="text-[#991B1B] font-mono font-bold">CREATOR</strong>. Người dùng có thể xuất bản video, tạo kênh và tham gia hợp đồng thuyết minh.
              </p>
            </div>
          </div>

          {/* Rejection notice if already rejected */}
          {item.status === 'REJECTED' && item.rejectionReason && (
            <div className="rounded-2xl border border-[#EF4444]/30 bg-[#FEF2F2] p-4 space-y-1.5 shadow-2xs">
              <span className="font-bold text-[#DC2626] flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-4 w-4" />
                Lý do từ chối trước đó:
              </span>
              <p className="text-[#991B1B] italic pl-5.5 text-xs">“{item.rejectionReason}”</p>
            </div>
          )}

          {/* 2. Section 1: Thông tin liên hệ & xác thực matching Mockup */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF8F8] border border-rose-200 text-[#991B1B]">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#1C1917]">
                  Thông tin liên hệ & xác thực
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF7EE] text-[#1E7E34] border border-[#C7EED8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Đã xác thực OTP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Email tài khoản */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                  Email tài khoản
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-sm text-[#111827] truncate">
                    {item.userEmail}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.userEmail, 'email tài khoản', e)}
                    className="text-[#6B7280] hover:text-[#111827] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                    title="Sao chép email"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Box 2: Email liên hệ xác thực */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                  Email liên hệ xác thực
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-sm text-[#111827] truncate">
                    <Mail className="h-4 w-4 text-[#6B7280] shrink-0" />
                    <span className="truncate">{item.contactEmail || item.userEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.contactEmail || item.userEmail, 'email liên hệ', e)}
                    className="text-[#6B7280] hover:text-[#111827] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                    title="Sao chép email liên hệ"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Box 3: Số điện thoại */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                  Số điện thoại
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-sm text-[#111827]">
                    <Phone className="h-4 w-4 text-[#6B7280] shrink-0" />
                    <span>{item.phone ? formatPhoneSpaced(item.phone) : 'Chưa liên kết SĐT'}</span>
                  </div>
                  {item.phone && (
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.phone || '', 'số điện thoại', e)}
                      className="text-[#6B7280] hover:text-[#111827] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                      title="Sao chép số điện thoại"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Box 4: Phương thức & thời gian OTP */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                  Phương thức & thời gian OTP
                </span>
                <div className="flex items-center gap-2 font-semibold text-sm text-[#111827]">
                  <ShieldCheck className="h-4 w-4 text-[#059669] shrink-0" />
                  <span>{methodBadge.label}</span>
                </div>
                <p className="text-[11px] font-mono text-[#6B7280]">
                  {item.otpVerifiedAt
                    ? `Đã xác minh: ${formatKycDateTime(item.otpVerifiedAt)}`
                    : `Ghi nhận lúc: ${formatKycDateTime(item.createdAt)}`}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Section 2: Thông tin thanh toán & ngân hàng matching Mockup */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EFF6FF] border border-blue-200 text-[#1D4ED8]">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#1C1917]">
                  Thông tin thanh toán & ngân hàng
                </h3>
              </div>
              <span className="text-xs text-[#78716C] font-mono">Chi trả thù lao & Ký quỹ</span>
            </div>

            {item.bankName || item.bankAccountNumber || item.bankAccountHolder ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Col 1: Ngân hàng */}
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                    Ngân hàng
                  </span>
                  <p className="font-semibold text-sm text-[#111827]">
                    {item.bankName || 'Chưa cung cấp'}
                  </p>
                </div>

                {/* Col 2: Số tài khoản */}
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                      Số tài khoản
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowFullBank(!showFullBank)}
                        className="text-[#991B1B] hover:underline text-[11px] flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {showFullBank ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Ẩn bớt</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Hiện đầy đủ</span>
                          </>
                        )}
                      </button>
                      {item.bankAccountNumber && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(item.bankAccountNumber || '', 'số tài khoản', e)}
                          className="text-[#6B7280] hover:text-[#111827] p-0.5 rounded cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-mono font-bold text-sm text-[#111827]">
                    {item.bankAccountNumber
                      ? showFullBank
                        ? item.bankAccountNumber
                        : `•••• ${item.bankAccountNumber.slice(-4)}`
                      : 'Chưa cung cấp'}
                  </p>
                </div>

                {/* Col 3: Chủ tài khoản */}
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/60 p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
                    Chủ tài khoản
                  </span>
                  <p className="font-semibold text-sm text-[#111827] uppercase">
                    {item.bankAccountHolder || 'Chưa cung cấp'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAF8F5]/40 p-5 text-center text-xs text-[#78716C]">
                Ứng viên chưa cung cấp thông tin tài khoản ngân hàng trong hồ sơ này.
              </div>
            )}
          </div>

          {/* 4. Section 3: Hồ sơ tác giả & kênh tham chiếu matching Mockup */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF5FF] border border-purple-200 text-[#7E22CE]">
                  <Globe className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#1C1917]">
                  Hồ sơ tác giả & kênh tham chiếu
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-[#78716C] block mb-1.5 text-[11px] uppercase tracking-wider">
                  Liên kết kênh:
                </span>
                {item.portfolioUrl ? (
                  <a
                    href={item.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#991B1B] hover:underline break-all cursor-pointer bg-[#FFF8F8] px-3.5 py-2 rounded-xl border border-rose-200"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="font-mono">{item.portfolioUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[#9CA3AF] italic">Ứng viên không cung cấp liên kết ngoài</span>
                )}
              </div>

              <div>
                <span className="font-bold text-[#78716C] block mb-1.5 text-[11px] uppercase tracking-wider">
                  Tiểu sử tác giả:
                </span>
                {item.bio ? (
                  <p className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]/80 p-4 text-[#374151] whitespace-pre-line leading-relaxed text-[13px]">
                    {item.bio}
                  </p>
                ) : (
                  <p className="text-[#9CA3AF] italic">
                    Ứng viên chưa cung cấp thông tin tiểu sử giới thiệu bản thân.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Inline Rejection Form when clicked "Từ chối hồ sơ" */}
          {showRejectForm && (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 space-y-3 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Lý do từ chối hồ sơ KYC
                </span>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-xs text-[#78716C] hover:text-[#111827] cursor-pointer"
                >
                  Hủy
                </button>
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do chi tiết để ứng viên chỉnh sửa lại..."
                rows={3}
                className="w-full rounded-xl border border-red-200 bg-white p-3 text-xs text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-red-500"
              />

              {/* Predefined reason tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PREDEFINED_REJECTION_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] text-[#991B1B] hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#57534E] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim() || isSubmitting}
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions matching Mockup */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EBE4D8] bg-white px-6 sm:px-8 py-4 shrink-0">
          {/* Left: Workbench link */}
          {onOpenWorkbench ? (
            <button
              type="button"
              onClick={handleOpenWorkbench}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78716C] hover:text-[#991B1B] active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Mở bàn làm việc toàn trang</span>
            </button>
          ) : (
            <div />
          )}

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {isPending && !showRejectForm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-[#DC2626] hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Từ chối hồ sơ</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApprove(item.id)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#059669] text-white text-xs font-semibold shadow-2xs hover:bg-[#047857] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Phê duyệt (Nâng cấp Creator)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Copy feedback toast */}
      {copiedField && (
        <div className="fixed bottom-12 right-8 z-60 rounded-xl bg-[#1C1917] px-4 py-2 text-xs font-semibold text-white shadow-lg animate-in fade-in duration-150">
          Đã sao chép {copiedField} vào bộ nhớ tạm
        </div>
      )}
    </div>
  );
};
