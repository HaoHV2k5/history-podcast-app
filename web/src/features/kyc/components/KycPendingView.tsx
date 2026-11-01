import React from 'react';
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  Mail,
  Phone,
  Landmark,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { KycProfile } from '@/types/kyc';
import { Button } from '@/components/ui/button';
import { maskAccountNumber } from '@/utils/formatters';
import { KycSecurityBanner } from './KycSecurityBanner';

interface KycPendingViewProps {
  profile: KycProfile;
  onRefresh: () => void;
  onOpenSecurity: () => void;
  isRefreshing?: boolean;
}

export const KycPendingView: React.FC<KycPendingViewProps> = ({
  profile,
  onRefresh,
  onOpenSecurity,
  isRefreshing = false,
}) => {
  const verifiedDate = profile.otpVerifiedAt
    ? new Date(profile.otpVerifiedAt).toLocaleDateString('vi-VN')
    : profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
    : 'Vừa gửi';

  return (
    <div className="space-y-3 sm:space-y-3.5 w-full" data-motion-target="pending-view">
      {/* Pending Hero Callout */}
      <section
        aria-label="Trạng thái chờ duyệt"
        className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#FDE68A] bg-[#FFFDF5] p-3.5 sm:p-4.5 shadow-2xs"
      >
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div
            className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]"
            aria-hidden="true"
          >
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10.5px] sm:text-[11px] font-bold text-[#92400E] border border-[#FDE68A]">
                <Clock className="h-3 w-3" />
                <span>CHỜ DUYỆT (PENDING)</span>
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-mono text-[#736B66]">
                Mã hồ sơ: #{profile.id || 3}
              </span>
              <span className="text-[#D1D5DB]">•</span>
              <span className="text-[10.5px] sm:text-[11px] text-[#736B66] font-medium">
                Gửi lúc: {verifiedDate}
              </span>
            </div>

            <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold tracking-tight text-[#1C1615]">
              Hồ sơ của bạn đang được thẩm định
            </h2>

            <p className="text-xs text-[#5C524F] leading-relaxed max-w-2xl">
              Quy trình thẩm định tư cách nhà sáng tạo đảm bảo các yêu cầu về tính chuẩn mực sử học và xác thực pháp lý tài khoản thanh toán. Ban Biên tập Sử Ký phản hồi trong vòng <strong>24 – 48 giờ làm việc (thời gian xử lý dự kiến)</strong>.
            </p>

            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                isLoading={isRefreshing}
                className="gap-1.5 border-[#D9D0C3] text-[#1C1615] hover:bg-[#FAF6EE] text-xs h-8 px-3"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Làm mới trạng thái</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-start">
        {/* Left Column: Submitted Data Review */}
        <article className="lg:col-span-8 rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1615] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#A31D24]" />
              <span>Thông tin đã gửi xét duyệt</span>
            </h3>
            <span className="text-[11px] text-[#736B66]">Chờ đối soát</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-[#EBE4D8] flex items-center justify-center text-[#736B66] shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#736B66] font-medium block">Họ và tên tác giả</span>
                <span className="text-sm font-semibold text-[#1C1615] block truncate">{profile.fullName}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-[#EBE4D8] flex items-center justify-center text-[#736B66] shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#736B66] font-medium block">Email liên hệ</span>
                <span className="text-sm font-mono font-semibold text-[#1C1615] block truncate">
                  {profile.contactEmail || profile.userEmail}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-[#EBE4D8] flex items-center justify-center text-[#736B66] shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#736B66] font-medium block">Số điện thoại</span>
                <span className="text-sm font-mono font-semibold text-[#1C1615] block">
                  {profile.phone || 'Chưa cập nhật'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-[#EBE4D8] flex items-center justify-center text-[#736B66] shrink-0">
                <Landmark className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#736B66] font-medium block">Ngân hàng thụ hưởng</span>
                <span className="text-sm font-semibold text-[#1C1615] block truncate">{profile.bankName || 'N/A'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-[#EBE4D8] flex items-center justify-center text-[#736B66] shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#736B66] font-medium block">Số tài khoản ngân hàng</span>
                <span className="text-sm font-mono font-semibold text-[#1C1615] block">
                  {profile.bankAccountNumber ? maskAccountNumber(profile.bankAccountNumber) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-[#EBE4D8] flex items-center justify-center text-[#736B66] shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#736B66] font-medium block">Chủ tài khoản thụ hưởng</span>
                <span className="text-sm font-mono font-semibold text-[#1C1615] block uppercase truncate">
                  {profile.bankAccountHolder || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Right Column: Timeline & Help */}
        <div className="lg:col-span-4 space-y-6">
          {/* Timeline Card */}
          <article className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#1C1615] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#A31D24]" />
              <span>Tiến độ xét duyệt</span>
            </h4>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-[#E7F6ED] text-[#168A4E] border border-[#BCE7CE] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#1C1615] block">Gửi hồ sơ & Xác thực email</span>
                  <span className="text-[#736B66]">Đã hoàn thành</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#B45309] animate-ping" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#B45309] block">Ban Biên tập thẩm định</span>
                  <span className="text-[#736B66]">Đang thực hiện (24–48h)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-medium text-[#736B66] block">Phê duyệt & Mở khóa kênh</span>
                  <span className="text-[#9CA3AF]">Chờ kết quả</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Bottom Security Banner */}
      <KycSecurityBanner onOpenSecurity={onOpenSecurity} />
    </div>
  );
};
