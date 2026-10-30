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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    formState: { errors },
  } = form;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 sm:space-y-8 w-full max-w-4xl"
      data-motion-target="form-view"
    >
      {isEditingResubmit && rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-red-700 block">Lưu ý chỉnh sửa:</span>
            <p className="text-[#1C1615] italic">"{rejectionReason}"</p>
          </div>
        </div>
      )}

      {/* STEP 1: OTP Email Verification */}
      <div className="rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4.5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A31D24] text-white text-[11px] font-bold">
              1
            </span>
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1615]">
              Xác thực địa chỉ Email liên hệ qua mã OTP
            </h3>
          </div>
          {isOtpVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6ED] px-2 py-0.5 text-[11px] font-semibold text-[#168A4E] border border-[#BCE7CE]">
              <CheckCircle2 className="h-3 w-3" />
              Đã xác thực OTP
            </span>
          )}
        </div>

        <p className="text-xs text-[#5C524F] leading-relaxed">
          Hệ thống sẽ gửi mã số bảo mật 6 chữ số đến địa chỉ email này để xác nhận quyền sở hữu hộp thư tác giả.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Địa chỉ Email xác thực <span className="text-[#A31D24]">*</span>
            </label>
            <Input
              type="email"
              value={otpEmail}
              onChange={(e) => {
                setOtpEmail(e.target.value);
                setIsOtpVerified(false);
              }}
              disabled={isOtpVerified || isSendingOtp}
              placeholder="tacgia@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              className="bg-white border-[#D9D0C3] focus:border-[#A31D24]"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant={isOtpVerified ? 'secondary' : 'primary'}
              onClick={onSendOtp}
              disabled={isSendingOtp || otpCooldown > 0 || isOtpVerified}
              isLoading={isSendingOtp}
              className="w-full gap-2 bg-[#A31D24] hover:bg-[#881313] text-white"
            >
              <Send className="h-4 w-4" />
              <span>
                {otpCooldown > 0
                  ? `Gửi lại (${otpCooldown}s)`
                  : isOtpSent
                  ? 'Gửi lại mã OTP'
                  : 'Gửi mã OTP'}
              </span>
            </Button>
          </div>
        </div>

        {/* OTP Code Input */}
        {isOtpSent && !isOtpVerified && (
          <div className="pt-2 border-t border-[#F0EBE1]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#1C1615] block">
                  Nhập mã OTP 6 chữ số <span className="text-[#A31D24]">*</span>
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="font-mono text-base tracking-widest text-center sm:text-left bg-white border-[#D9D0C3]"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={onVerifyOtp}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  isLoading={isVerifyingOtp}
                  className="w-full gap-2 bg-[#A31D24] hover:bg-[#881313] text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác nhận mã</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Feedback Messages */}
        {otpMessage && (
          <div
            className={`rounded-xl p-3 text-xs flex items-start gap-2.5 ${
              otpMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {otpMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{otpMessage.text}</span>
          </div>
        )}
      </div>

      {/* STEP 2: Author Identity & Bank Information */}
      <div className="rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4.5 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A31D24] text-white text-[11px] font-bold">
            2
          </span>
          <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1615]">
            Thông tin định danh tác giả & Tài khoản nhận nhuận bút
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Họ và tên tác giả đầy đủ <span className="text-[#A31D24]">*</span>
            </label>
            <Input
              {...register('fullName')}
              placeholder="Nguyễn Văn An"
              error={Boolean(errors.fullName)}
              leftIcon={<User className="h-4 w-4 text-[#736B66]" />}
              className="bg-white border-[#D9D0C3]"
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Số điện thoại liên hệ <span className="text-[#A31D24]">*</span>
            </label>
            <Input
              {...register('phone')}
              placeholder="0912345678"
              error={Boolean(errors.phone)}
              leftIcon={<Phone className="h-4 w-4 text-[#736B66]" />}
              className="bg-white border-[#D9D0C3]"
            />
            {errors.phone && (
              <p className="text-[11px] text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Contact Email (Read-only) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Email liên hệ chính thức (Trùng với email đã xác thực OTP) <span className="text-[#A31D24]">*</span>
            </label>
            <Input
              {...register('contactEmail')}
              readOnly
              className="bg-[#FAFAF7] cursor-not-allowed font-mono text-[#736B66] border-[#EBE4D8]"
              leftIcon={<Mail className="h-4 w-4 text-[#736B66]" />}
            />
          </div>

          {/* Bank Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Tên Ngân hàng thụ hưởng <span className="text-[#A31D24]">*</span>
            </label>
            <input
              {...register('bankName')}
              list="popular-banks"
              placeholder="Chọn hoặc nhập tên ngân hàng (vd: Vietcombank, MB Bank...)"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white text-[#1C1615] placeholder:text-[#9CA3AF] rounded-lg border border-[#D9D0C3] focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
            />
            <datalist id="popular-banks">
              {POPULAR_VIETNAMESE_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {errors.bankName && (
              <p className="text-[11px] text-red-600">{errors.bankName.message}</p>
            )}
          </div>

          {/* Bank Account Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Số tài khoản ngân hàng <span className="text-[#A31D24]">*</span>
            </label>
            <Input
              {...register('bankAccountNumber')}
              placeholder="0011001234567"
              error={Boolean(errors.bankAccountNumber)}
              leftIcon={<CreditCard className="h-4 w-4 text-[#736B66]" />}
              className="bg-white border-[#D9D0C3] font-mono"
            />
            {errors.bankAccountNumber && (
              <p className="text-[11px] text-red-600">{errors.bankAccountNumber.message}</p>
            )}
          </div>

          {/* Bank Account Holder */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Tên chủ tài khoản (Viết in hoa không dấu) <span className="text-[#A31D24]">*</span>
            </label>
            <Input
              {...register('bankAccountHolder')}
              placeholder="NGUYEN VAN AN"
              className="uppercase bg-white border-[#D9D0C3] font-mono"
              error={Boolean(errors.bankAccountHolder)}
              leftIcon={<User className="h-4 w-4 text-[#736B66]" />}
            />
            {errors.bankAccountHolder && (
              <p className="text-[11px] text-red-600">{errors.bankAccountHolder.message}</p>
            )}
          </div>

          {/* Bio (Optional) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Tiểu sử & Phong cách nghiên cứu lịch sử (Không bắt buộc)
            </label>
            <Textarea
              {...register('bio')}
              placeholder="Giới thiệu sơ lược về định hướng nội dung podcast, giai đoạn lịch sử bạn quan tâm..."
              rows={3}
              error={Boolean(errors.bio)}
              className="bg-white border-[#D9D0C3]"
            />
            {errors.bio && (
              <p className="text-[11px] text-red-600">{errors.bio.message}</p>
            )}
          </div>

          {/* Portfolio URL (Optional) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Liên kết Hồ sơ năng lực / Kênh cá nhân (Không bắt buộc)
            </label>
            <Input
              {...register('portfolioUrl')}
              placeholder="https://facebook.com/trangtacgia hoặc https://youtube.com/..."
              error={Boolean(errors.portfolioUrl)}
              leftIcon={<Globe className="h-4 w-4 text-[#736B66]" />}
              className="bg-white border-[#D9D0C3] font-mono text-xs sm:text-sm"
            />
            {errors.portfolioUrl && (
              <p className="text-[11px] text-red-600">{errors.portfolioUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 3: Terms & Submission */}
      <div className="rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4.5 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A31D24] text-white text-[11px] font-bold">
            3
          </span>
          <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1615]">
            Cam kết trách nhiệm & Gửi hồ sơ
          </h3>
        </div>

        <div className="space-y-3">
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
            <p className="text-[11px] text-red-600 pl-7">{errors.agreeTerms.message}</p>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl p-3 bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{submitError}</span>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || (!isOtpVerified)}
            isLoading={isSubmitting}
            className="gap-2 bg-[#A31D24] hover:bg-[#881313] text-white shadow-sm"
          >
            <Send className="h-4 w-4" />
            <span>{isEditingResubmit ? 'Nộp lại hồ sơ KYC' : 'Nộp hồ sơ xét duyệt Creator'}</span>
          </Button>

          {isEditingResubmit && onCancelResubmit && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onCancelResubmit}
              className="border-[#D9D0C3] text-[#5C524F]"
            >
              Hủy chỉnh sửa
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
