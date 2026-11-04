import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Mail,
  Send,
  Lock,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  CreditCard,
  Landmark,
  BookOpen,
  Globe,
  FileCheck,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';

const POPULAR_VIETNAMESE_BANKS = [
  'Vietcombank (Ngân hàng Ngoại thương Việt Nam)',
  'MB Bank (Ngân hàng Quân đội)',
  'Techcombank (Ngân hàng Kỹ thương)',
  'BIDV (Ngân hàng Đầu tư và Phát triển)',
  'VietinBank (Ngân hàng Công thương)',
  'ACB (Ngân hàng Á Châu)',
  'VPBank (Ngân hàng Việt Nam Thịnh Vượng)',
  'TPBank (Ngân hàng Tiên Phong)',
  'Sacombank (Ngân hàng Sài Gòn Thương Tín)',
  'VIB (Ngân hàng Quốc tế)',
  'Agribank (Ngân hàng Nông nghiệp & PTNT)',
  'HDBank (Ngân hàng Phát triển TP.HCM)',
  'MSB (Ngân hàng Hàng Hải)',
  'OCB (Ngân hàng Phương Đông)',
  'SHB (Ngân hàng Sài Gòn - Hà Nội)',
];

export interface KycFormData {
  fullName: string;
  phone: string;
  contactEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bio?: string;
  portfolioUrl?: string;
  agreeTerms: boolean;
}

interface KycFormViewProps {
  form: UseFormReturn<KycFormData>;
  onSubmit: (data: KycFormData) => void;
  // OTP state
  otpEmail: string;
  setOtpEmail: (val: string) => void;
  otpCode: string;
  setOtpCode: (val: string) => void;
  otpCooldown: number;
  isOtpSent: boolean;
  isOtpVerified: boolean;
  setIsOtpVerified: (val: boolean) => void;
  otpMessage: { type: 'success' | 'error'; text: string } | null;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  isEditingResubmit: boolean;
  onCancelResubmit?: () => void;
  rejectionReason?: string;
}

export const KycFormView: React.FC<KycFormViewProps> = ({
  form,
  onSubmit,
  otpEmail,
  setOtpEmail,
  otpCode,
  setOtpCode,
  otpCooldown,
  isOtpSent,
  isOtpVerified,
  setIsOtpVerified,
  otpMessage,
  onSendOtp,
  onVerifyOtp,
  isSendingOtp,
  isVerifyingOtp,
  isSubmitting,
  submitError,
  isEditingResubmit,
  onCancelResubmit,
  rejectionReason,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const watchedBio = watch('bio') || '';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 w-full max-w-4xl"
      data-motion-target="form-view"
    >
      {/* Editorial Rejection Notice (When Resubmitting) */}
      {isEditingResubmit && rejectionReason && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs flex-1">
            <span className="font-bold text-red-800 text-sm block">
              Ghi chú hiệu chỉnh từ Ban Biên tập:
            </span>
            <p className="text-[#1C1615] leading-relaxed italic bg-white/70 p-3 rounded-lg border border-red-200/60 mt-1">
              "{rejectionReason}"
            </p>
            <p className="text-[#5C524F] pt-1">
              Vui lòng rà soát lại thông tin định danh và tài khoản thụ hưởng theo hướng dẫn trên để được duyệt nhanh chóng.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Step Progress Stepper Bar */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 shadow-2xs select-none">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 Indicator */}
          <div
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-150',
              isOtpVerified
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-[#FAF8F5] border-[#EBE4D8] text-[#1C1615]'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                isOtpVerified
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#A31D24] text-white'
              )}
            >
              {isOtpVerified ? <Check className="h-4 w-4 stroke-[3]" /> : '1'}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold block">Bước 1: Xác thực OTP</span>
              <span className="text-[10px] text-[#786D66] block truncate">
                {isOtpVerified ? 'Email đã hợp lệ' : 'Bảo mật quyền tác giả'}
              </span>
            </div>
          </div>

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl border bg-[#FAF8F5] border-[#EBE4D8] text-[#1C1615]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#D9D0C3] text-[#786D66] text-xs font-bold">
              2
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold block">Bước 2: Định danh & Ngân hàng</span>
              <span className="text-[10px] text-[#786D66] block truncate">
                Họ tên, SĐT, tài khoản nhận tiền
              </span>
            </div>
          </div>

          {/* Step 3 Indicator */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl border bg-[#FAF8F5] border-[#EBE4D8] text-[#1C1615]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#D9D0C3] text-[#786D66] text-xs font-bold">
              3
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold block">Bước 3: Cam kết & Gửi</span>
              <span className="text-[10px] text-[#786D66] block truncate">
                Đối soát trong 24–48h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STEP 1: OTP Email Verification ──────────────────────────────── */}
      <article className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-[#A31D24]">
              <Mail className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1615]">
              Bước 1: Xác thực địa chỉ Email qua mã OTP
            </h3>
          </div>
          {isOtpVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Đã xác thực email</span>
            </span>
          )}
        </div>

        <p className="text-xs text-[#5C524F] leading-relaxed">
          Hệ thống sẽ gửi mã số bảo mật 6 chữ số đến địa chỉ email này để xác nhận quyền sở hữu hộp thư tác giả, đảm bảo các thông báo tài chính và hợp đồng bản quyền được gửi đúng địa chỉ.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Địa chỉ Email xác thực <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => {
                  setOtpEmail(e.target.value);
                  setIsOtpVerified(false);
                }}
                disabled={isOtpVerified || isSendingOtp}
                placeholder="tacgia@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#D9D0C3] bg-white text-xs sm:text-sm font-medium text-[#1C1615] placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24] disabled:bg-[#FAFAF7] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={onSendOtp}
              disabled={isSendingOtp || otpCooldown > 0 || isOtpVerified}
              className="w-full h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] hover:bg-[#881313] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {otpCooldown > 0
                  ? `Gửi lại (${otpCooldown}s)`
                  : isOtpSent
                  ? 'Gửi lại mã OTP'
                  : 'Gửi mã OTP'}
              </span>
            </button>
          </div>
        </div>

        {/* OTP Code Input Box */}
        {isOtpSent && !isOtpVerified && (
          <div className="pt-3 border-t border-[#F0EBE1] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[#1C1615] block">
                  Nhập mã OTP 6 chữ số <span className="text-[#A31D24]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#D9D0C3] bg-white font-mono text-base tracking-widest text-[#1C1615] placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onVerifyOtp}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] hover:bg-[#881313] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác nhận mã</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Status Messages */}
        {otpMessage && (
          <div
            className={cn(
              'rounded-xl p-3 text-xs flex items-start gap-2.5 border shadow-2xs',
              otpMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            )}
          >
            {otpMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <span className="leading-relaxed font-medium">{otpMessage.text}</span>
          </div>
        )}
      </article>

      {/* ─── STEP 2: Author Identity & Bank Information ──────────────────── */}
      <article className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-[#A31D24]">
              <User className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1615]">
              Bước 2: Thông tin định danh & Tài khoản nhận nhuận bút
            </h3>
          </div>
          <span className="text-xs text-[#786D66]">Bắt buộc để đối soát thanh toán</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Họ và tên tác giả đầy đủ <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <User className="h-4 w-4" />
              </div>
              <input
                {...register('fullName')}
                placeholder="Ví dụ: Nguyễn Văn An"
                className={cn(
                  'w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-[#1C1615] bg-white placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                  errors.fullName ? 'border-red-500' : 'border-[#D9D0C3]'
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-red-600 font-medium">{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Số điện thoại liên hệ <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <Phone className="h-4 w-4" />
              </div>
              <input
                {...register('phone')}
                placeholder="0912345678"
                className={cn(
                  'w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium font-mono text-[#1C1615] bg-white placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                  errors.phone ? 'border-red-500' : 'border-[#D9D0C3]'
                )}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-600 font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Contact Email (Read-only, matches verified OTP) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Email liên hệ chính thức (Đồng bộ từ email xác thực OTP) <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                {...register('contactEmail')}
                readOnly
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#EBE4D8] bg-[#FAFAF7] font-mono text-xs sm:text-sm text-[#5C524F] cursor-not-allowed select-all"
              />
            </div>
          </div>

          {/* Bank Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Ngân hàng thụ hưởng <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <Landmark className="h-4 w-4" />
              </div>
              <input
                {...register('bankName')}
                list="popular-banks"
                placeholder="Chọn hoặc nhập tên ngân hàng (vd: Vietcombank, MB Bank, Techcombank...)"
                className={cn(
                  'w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-[#1C1615] bg-white placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                  errors.bankName ? 'border-red-500' : 'border-[#D9D0C3]'
                )}
              />
            </div>
            <datalist id="popular-banks">
              {POPULAR_VIETNAMESE_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {errors.bankName && (
              <p className="text-[11px] text-red-600 font-medium">{errors.bankName.message}</p>
            )}
          </div>

          {/* Bank Account Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Số tài khoản ngân hàng <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <CreditCard className="h-4 w-4" />
              </div>
              <input
                {...register('bankAccountNumber')}
                placeholder="0011001234567"
                className={cn(
                  'w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-mono font-medium text-[#1C1615] bg-white placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                  errors.bankAccountNumber ? 'border-red-500' : 'border-[#D9D0C3]'
                )}
              />
            </div>
            {errors.bankAccountNumber && (
              <p className="text-[11px] text-red-600 font-medium">{errors.bankAccountNumber.message}</p>
            )}
          </div>

          {/* Bank Account Holder */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Tên chủ tài khoản (Viết in hoa không dấu) <span className="text-[#A31D24]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <User className="h-4 w-4" />
              </div>
              <input
                {...register('bankAccountHolder')}
                placeholder="NGUYEN VAN AN"
                className={cn(
                  'w-full pl-10 pr-3.5 py-2.5 rounded-lg border uppercase text-xs sm:text-sm font-mono font-medium text-[#1C1615] bg-white placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                  errors.bankAccountHolder ? 'border-red-500' : 'border-[#D9D0C3]'
                )}
              />
            </div>
            {errors.bankAccountHolder && (
              <p className="text-[11px] text-red-600 font-medium">{errors.bankAccountHolder.message}</p>
            )}
          </div>

          {/* Bio (Optional) */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1C1615] block">
                Tiểu sử tác giả & Phong cách nghiên cứu lịch sử (Không bắt buộc)
              </label>
              <span className="text-[10px] text-[#786D66] font-mono tabular-nums">
                {watchedBio.length}/500
              </span>
            </div>
            <textarea
              {...register('bio')}
              rows={3}
              maxLength={500}
              placeholder="Giới thiệu sơ lược về định hướng nội dung podcast, giai đoạn lịch sử bạn quan tâm..."
              className={cn(
                'w-full p-3 rounded-lg border text-xs sm:text-sm font-medium text-[#1C1615] bg-white placeholder:text-[#9CA3AF] leading-relaxed transition-all resize-y focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                errors.bio ? 'border-red-500' : 'border-[#D9D0C3]'
              )}
            />
            {errors.bio && (
              <p className="text-[11px] text-red-600 font-medium">{errors.bio.message}</p>
            )}
          </div>

          {/* Portfolio URL (Optional) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Liên kết Hồ sơ năng lực / Kênh cá nhân (Không bắt buộc)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#786D66]">
                <Globe className="h-4 w-4" />
              </div>
              <input
                {...register('portfolioUrl')}
                placeholder="https://facebook.com/trangtacgia hoặc https://youtube.com/..."
                className={cn(
                  'w-full pl-10 pr-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm text-[#1C1615] bg-white placeholder:text-[#9CA3AF] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                  errors.portfolioUrl ? 'border-red-500' : 'border-[#D9D0C3]'
                )}
              />
            </div>
            {errors.portfolioUrl && (
              <p className="text-[11px] text-red-600 font-medium">{errors.portfolioUrl.message}</p>
            )}
          </div>
        </div>
      </article>

      {/* ─── STEP 3: Terms & Submission ──────────────────────────────────── */}
      <article className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#F0EBE1] pb-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-[#A31D24]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1615]">
            Bước 3: Cam kết trách nhiệm & Gửi hồ sơ xét duyệt
          </h3>
        </div>

        <div className="space-y-2 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] p-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('agreeTerms')}
              className="mt-1 h-4 w-4 rounded border-[#D9D0C3] text-[#A31D24] focus:ring-[#A31D24]"
            />
            <span className="text-xs text-[#38302E] leading-relaxed">
              Tôi cam kết mọi thông tin định danh và tài khoản ngân hàng trên là hoàn toàn chính xác. Tôi đồng ý tuân thủ <strong>Quy chuẩn Biên tập & Tiêu chuẩn Sử học Sử Ký</strong>, không phổ biến nội dung xuyên tạc lịch sử dân tộc.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-[11px] text-red-600 font-medium pl-7">{errors.agreeTerms.message}</p>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl p-3 bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{submitError}</span>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isOtpVerified}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] hover:bg-[#881313] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>{isEditingResubmit ? 'Nộp lại hồ sơ KYC' : 'Nộp hồ sơ xét duyệt Creator'}</span>
          </button>

          {isEditingResubmit && onCancelResubmit && (
            <button
              type="button"
              onClick={onCancelResubmit}
              className="inline-flex items-center justify-center rounded-lg border border-[#D9D0C3] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#5C524F] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </article>
    </form>
  );
};
