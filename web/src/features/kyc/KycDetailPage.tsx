import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  UserCheck,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  FileCheck2,
  Sparkles,
  Landmark,
  CreditCard,
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Clock,
  Activity,
  FileText,
  Link2,
} from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { WorkbenchSkeleton } from '@/components/common/LoadingSkeleton';
import { kycApi } from '@/services/api/kyc';
import {
  getInitials,
  getVerificationMethodBadge,
  getKycStatusBadgeConfig,
  formatKycDateTime,
} from './kycLogic';
import { cn } from '@/utils/cn';

const KYC_IDENTITY_REJECTION_REASONS = [
  'Thông tin họ tên và số điện thoại không khớp',
  'Tài khoản thụ hưởng ngân hàng không chính chủ',
  'Liên hệ email/SĐT không nhận được phản hồi xác minh',
  'Đường dẫn portfolio/kênh tham chiếu không hợp lệ',
  'Chưa đáp ứng đủ tiêu chuẩn nội dung và quy chuẩn Sử Ký',
];

export const KycDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const kycId = Number(id);

  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBack = () => {
    if ('startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        navigate('/admin/kyc');
      });
    } else {
      navigate('/admin/kyc');
    }
  };

  const maskPhone = (phone?: string | null) => {
    if (!phone) return 'Chưa liên kết SĐT';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length >= 7) {
      return `${digits.slice(0, 3)}••••${digits.slice(-3)}`;
    }
    return phone;
  };

  if (isLoading) {
    return <WorkbenchSkeleton />;
  }

  if (isError || !item) {
    return (
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-8 text-center shadow-xs">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#991B1B] mb-3" />
        <h2 className="font-serif text-lg font-bold text-[#1C1917] mb-1">
          Không tìm thấy hồ sơ KYC
        </h2>
        <p className="text-xs text-[#78716C] mb-4">
          Hồ sơ định danh ID #{kycId} không tồn tại hoặc đã được xử lý.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E0DDD7] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C1917] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isPending = item.status === 'PENDING';
  const initials = getInitials(item.fullName || item.userEmail);
  const methodBadge = getVerificationMethodBadge(item.verificationMethod);
  const statusBadge = getKycStatusBadgeConfig(item.status);

  const handleDecisionSubmit = (reason?: string) => {
    if (!modalType) return;
    statusMutation.mutate({
      status: modalType,
      rejectionReason: reason || undefined,
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between animate-in fade-in-0 duration-300 ease-out select-none">
      <div className="pb-8">
        {/* 1. Header Banner matching Bàn làm việc toàn trang.png (Seamless & Full-bleed) */}
        <div className="relative overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-5 select-none min-h-[135px]">
          {/* Authentic Vietnamese Pagoda & Landscape Panorama Backdrop */}
          <img
            src="/assets/studio/admin-kyc-detail-hero-panorama.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-full max-h-[135px] w-auto max-w-[55%] md:max-w-[65%] lg:max-w-[72%] object-contain object-right-bottom select-none z-0 hidden sm:block"
          />

          <div className="relative z-10 max-w-2xl">
            {/* Back link */}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#991B1B] transition-colors mb-2 cursor-pointer"
            >
              <span className="text-sm font-bold">←</span>
              <span>Hàng đợi xác thực KYC</span>
            </button>

            {/* Avatar & Title & Badge */}
            <div className="flex items-center gap-4 mt-1">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-bold text-lg bg-[#FFE4E6] text-[#991B1B] border border-rose-200 shadow-2xs"
              >
                {initials}
              </div>

              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-2xl md:text-[26px] font-bold text-[#1C1917] tracking-tight leading-snug">
                    {item.fullName || item.userEmail}
                  </h1>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                      statusBadge.bgColor,
                      statusBadge.textColor,
                      statusBadge.borderColor
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', statusBadge.dotColor)} />
                    {statusBadge.label}
                  </span>
                </div>

                {/* Subtitle Metadata Pills (No bullet dots) */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/90 border border-[#E7E2DA] shadow-2xs font-mono text-[11px] text-[#78716C]">
                    <span>Hồ sơ ID</span>
                    <strong className="font-bold text-[#1C1917]">#{item.id}</strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/90 border border-[#E7E2DA] shadow-2xs font-mono text-[11px] text-[#78716C]">
                    <span>User ID</span>
                    <strong className="font-bold text-[#1C1917]">#{item.userId}</strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/90 border border-[#E7E2DA] shadow-2xs text-[11px] text-[#78716C]">
                    <Mail className="h-3 w-3 text-[#991B1B]" />
                    <span>Email</span>
                    <strong className="font-mono font-medium text-[#1C1917]">{item.userEmail}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Two-Column Grid: 8 Cols Main, 4 Cols Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
          {/* Main Content Area (8 cols) - 100% Real Backend Data */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {/* Card 1: Thông tin định danh ứng viên */}
            <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={2} />
                  <h3 className="font-serif text-base font-bold text-[#1C1917]">
                    Thông tin định danh ứng viên
                  </h3>
                </div>
                <span className="text-xs text-[#78716C]">
                  User ID #{item.userId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Box 1: Họ và tên đầy đủ */}
                <div className="flex items-center justify-between rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <User className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#78716C]">Họ và tên đầy đủ</span>
                      <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                        {item.fullName || 'Chưa cung cấp'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box 2: Email tài khoản đăng nhập */}
                <div className="flex items-center justify-between rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Mail className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#78716C]">Email tài khoản đăng nhập</span>
                      <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                        {item.userEmail}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box 3: Email liên hệ đã xác thực */}
                <div className="flex items-center justify-between rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Mail className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#78716C]">Email liên hệ đã xác thực</span>
                      <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                        {item.contactEmail || item.userEmail}
                      </span>
                    </div>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#059669] shrink-0" strokeWidth={2} />
                </div>

                {/* Box 4: Số điện thoại đã bảo mật */}
                <div className="flex items-center justify-between rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Phone className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#78716C]">Số điện thoại đã bảo mật</span>
                      <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                        {maskPhone(item.phone)}
                      </span>
                    </div>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#059669] shrink-0" strokeWidth={2} />
                </div>
              </div>
            </div>

            {/* Card 2: Trạng thái xác thực bảo mật hai lớp */}
            <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={2} />
                  <h3 className="font-serif text-base font-bold text-[#1C1917]">
                    Trạng thái xác thực bảo mật hai lớp
                  </h3>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  Đã xác thực OTP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Box 1: Phương thức xác minh */}
                <div className="flex items-center gap-3.5 rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <Lock className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#78716C]">Phương thức xác minh</span>
                    <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                      {item.verificationMethod === 'PHONE'
                        ? 'OTP Số điện thoại (Firebase SMS)'
                        : `${methodBadge.label} (Brevo HTTPS)`}
                    </span>
                  </div>
                </div>

                {/* Box 2: Thời điểm hoàn tất OTP */}
                <div className="flex items-center gap-3.5 rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <Clock className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#78716C]">Thời điểm hoàn tất OTP</span>
                    <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                      {item.otpVerifiedAt
                        ? formatKycDateTime(item.otpVerifiedAt)
                        : formatKycDateTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Tài khoản thụ hưởng thanh toán (Ngân hàng) */}
            <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={2} />
                  <h3 className="font-serif text-base font-bold text-[#1C1917]">
                    Tài khoản thụ hưởng thanh toán (Ngân hàng)
                  </h3>
                </div>
                <span className="text-xs text-[#78716C]">Chi trả thù lao & Ký quỹ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                {/* Ngân hàng */}
                <div className="flex items-center gap-3.5 rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <ShieldCheck className="h-5 w-5 text-[#059669] shrink-0" strokeWidth={2} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#78716C]">Ngân hàng thụ hưởng</span>
                    <span className="font-sans font-bold text-sm text-[#1C1917] truncate">
                      {item.bankName || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CreditCard className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#78716C]">Số tài khoản</span>
                      <span className="font-mono font-bold text-sm text-[#1C1917] truncate">
                        {item.bankAccountNumber || 'Chưa cung cấp'}
                      </span>
                    </div>
                  </div>
                  {item.bankAccountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(item.bankAccountNumber || '', 'số tài khoản')}
                      className="text-[#78716C] hover:text-[#1C1917] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center gap-3.5 rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-3.5 sm:p-4 hover:border-[#D7CEC7] transition-colors">
                  <User className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#78716C]">Chủ tài khoản</span>
                    <span className="font-sans font-bold text-sm text-[#1C1917] uppercase truncate">
                      {item.bankAccountHolder || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Tiểu sử & Hồ sơ sáng tạo */}
            <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={2} />
                <h3 className="font-serif text-base font-bold text-[#1C1917]">
                  Tiểu sử & Hồ sơ sáng tạo
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Đường dẫn Portfolio */}
                <div className="flex items-center gap-3.5">
                  <Link2 className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-[#78716C]">Đường dẫn Portfolio / Kênh tham chiếu</span>
                    {item.portfolioUrl ? (
                      <a
                        href={item.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-sans font-bold text-sm text-[#991B1B] hover:underline truncate cursor-pointer mt-0.5"
                      >
                        <span>{item.portfolioUrl}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#9CA3AF] italic mt-0.5">Chưa cung cấp liên kết</span>
                    )}
                  </div>
                </div>

                {/* Tiểu sử giới thiệu */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.75} />
                    <span className="text-[11px] text-[#78716C]">Tiểu sử giới thiệu bản thân</span>
                  </div>
                  <div className="rounded-xl border border-[#EBE4D8] bg-[#FAFAF9]/80 p-4 text-xs font-medium text-[#1C1917] leading-relaxed">
                    {item.bio || 'Chưa cung cấp thông tin tiểu sử giới thiệu bản thân.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspector Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
            {/* Card 1: Cơ chế tự động nâng cấp vai trò */}
            <div className="rounded-2xl border border-[#991B1B]/20 bg-[#FFF8F8] p-5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-[#991B1B] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-[#991B1B]" />
                <span>Cơ chế tự động nâng cấp vai trò</span>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Khi phê duyệt hồ sơ này, hệ thống sẽ tự động gán vai trò{' '}
                <strong className="font-bold text-[#991B1B]">CREATOR</strong> cho tài khoản. Người dùng sẽ có quyền truy cập Creator Studio và xuất bản video.
              </p>
            </div>

            {/* Card 2: Tiến trình hồ sơ */}
            <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-3">
                <Activity className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={2} />
                <h4 className="font-serif text-sm font-bold text-[#1C1917]">
                  Tiến trình hồ sơ
                </h4>
              </div>

              <div className="relative pl-1 space-y-6 text-xs">
                {/* Node 1: Latest Status */}
                <div className="relative flex items-start gap-3">
                  {item.status === 'APPROVED' ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : item.status === 'REJECTED' ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-white">
                      <XCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className="flex-1 flex items-start justify-between gap-2 min-w-0">
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'font-bold text-xs sm:text-[13px]',
                          item.status === 'APPROVED'
                            ? 'text-[#059669]'
                            : item.status === 'REJECTED'
                            ? 'text-[#DC2626]'
                            : 'text-[#D97706]'
                        )}
                      >
                        {statusBadge.label}
                      </span>
                      <span className="text-[11px] text-[#78716C] mt-0.5">
                        {item.status === 'APPROVED'
                          ? 'Bởi: Quản trị viên hệ thống'
                          : item.status === 'REJECTED'
                          ? `Lý do: ${item.rejectionReason || 'Không đạt yêu cầu'}`
                          : 'Đang trong hàng đợi thẩm định'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#78716C] shrink-0">
                      {formatKycDateTime(item.updatedAt || item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Connecting vertical line */}
                <div className="absolute left-[15px] top-6 bottom-4 w-0.5 bg-[#E5E7EB]" />

                {/* Node 2: Submission */}
                <div className="relative flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-[#78716C]">
                    <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
                  </div>

                  <div className="flex-1 flex items-start justify-between gap-2 min-w-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs sm:text-[13px] text-[#1C1917]">
                        Gửi hồ sơ
                      </span>
                      <span className="text-[11px] text-[#78716C] mt-0.5">
                        Bởi: Người dùng
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#78716C] shrink-0">
                      {formatKycDateTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Decision Action Bar matching ModerationDetailPage */}
      <div className="sticky bottom-0 z-30 mt-auto -mx-4 sm:-mx-6 md:-mx-8 border-t border-[#EAE6DF] bg-white px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4">
        {isPending ? (
          <>
            <div className="flex items-center gap-2 text-xs text-[#57534E]">
              <FileCheck2 className="h-4 w-4 text-[#D97706]" />
              <span>Vui lòng kiểm tra kỹ thông tin liên hệ và tài khoản ngân hàng trước khi phê duyệt</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalType('REJECTED')}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-white text-xs font-semibold text-[#DC2626] hover:bg-red-50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                <span>Từ chối hồ sơ</span>
              </button>
              <button
                type="button"
                onClick={() => setModalType('APPROVED')}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#059669] text-white text-xs font-semibold shadow-xs hover:bg-[#047857] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Phê duyệt làm Creator</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-xs text-[#57534E]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#059669]" />
              <span>Hồ sơ này đã có kết luận phê duyệt</span>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#991B1B] text-white text-xs font-semibold shadow-xs hover:bg-[#7F1D1D] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>← Quay lại hàng đợi</span>
            </button>
          </div>
        )}
      </div>

      {/* Copy toast */}
      {copiedField && (
        <div className="fixed bottom-20 right-8 z-50 rounded-xl bg-[#1C1917] px-4 py-2 text-xs font-semibold text-white shadow-lg animate-in fade-in duration-150">
          Đã sao chép {copiedField} vào bộ nhớ tạm
        </div>
      )}

      {/* Confirm Modal for Approve / Reject */}
      <ConfirmModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'APPROVED'
            ? 'Phê duyệt nâng quyền Nhà sáng tạo'
            : 'Từ chối hồ sơ xác thực danh tính'
        }
        description={
          modalType === 'APPROVED'
            ? `Bạn có chắc chắn muốn phê duyệt hồ sơ KYC #${item.id} của "${item.fullName || item.userEmail}"? Tài khoản sẽ được tự động nâng cấp quyền CREATOR.`
            : `Vui lòng chọn hoặc nhập lý do từ chối hồ sơ KYC #${item.id}:`
        }
        confirmText={modalType === 'APPROVED' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        variant={modalType === 'APPROVED' ? 'primary' : 'destructive'}
        requireReason={modalType === 'REJECTED'}
        reasonPlaceholder="Nhập lý do từ chối chi tiết..."
        quickReasons={KYC_IDENTITY_REJECTION_REASONS}
        isLoading={statusMutation.isPending}
        onConfirm={(reason?: string) => handleDecisionSubmit(reason)}
      />
    </div>
  );
};
