import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Mail,
  Phone,
  CreditCard,
  User,

  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Send,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { kycApi } from '@/services/api/kyc';
import { useKycGate } from './useKycGate';
import { maskAccountNumber } from '@/utils/formatters';

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

const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

const kycFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(255, 'Họ và tên không được vượt quá 255 ký tự'),
  phone: z
    .string()
    .min(1, 'Số điện thoại không được để trống')
    .regex(phoneRegex, 'Số điện thoại không đúng định dạng Việt Nam (10 chữ số)'),
  contactEmail: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng'),
  bankName: z.string().min(1, 'Vui lòng chọn hoặc nhập tên ngân hàng thụ hưởng'),
  bankAccountNumber: z
    .string()
    .min(4, 'Số tài khoản phải có ít nhất 4 chữ số')
    .max(25, 'Số tài khoản không vượt quá 25 chữ số')
    .regex(/^[0-9]+$/, 'Số tài khoản chỉ bao gồm các chữ số'),
  bankAccountHolder: z
    .string()
    .min(2, 'Tên chủ tài khoản phải có ít nhất 2 ký tự')
    .max(100, 'Tên chủ tài khoản không vượt quá 100 ký tự'),
  bio: z
    .string()
    .max(500, 'Tiểu sử không được vượt quá 500 ký tự')
    .optional()
    .or(z.literal('')),
  portfolioUrl: z
    .string()
    .url('Đường dẫn hồ sơ không đúng định dạng URL (vd: https://...)')
    .optional()
    .or(z.literal('')),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'Bạn cần cam kết tính xác thực của thông tin cung cấp' }),
  }),
});

type KycFormData = z.infer<typeof kycFormSchema>;

export const CreatorKycPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const {
    profile,
    isApproved,
    isPending,
    isRejected,
    rejectionReason,
    isLoading: isCheckingGate,
    refetch,
  } = useKycGate();

  // Mode for rejected profiles: user can view rejection or click "Edit & Resubmit"
  const [isEditingResubmit, setIsEditingResubmit] = useState(false);

  // OTP State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<KycFormData>({

    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      contactEmail: currentUser?.email || '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountHolder: '',
      bio: '',
      portfolioUrl: '',
      agreeTerms: false as unknown as true,
    },
  });

  // Keep OTP email in sync with contact email
  useEffect(() => {
    if (currentUser?.email && !otpEmail) {
      setOtpEmail(currentUser.email);
      setValue('contactEmail', currentUser.email);
    }
  }, [currentUser, otpEmail, setValue]);

  // If profile has otpVerifiedAt or when entering resubmit mode, pre-fill values
  useEffect(() => {
    if (profile) {
      setValue('fullName', profile.fullName || '');
      setValue('phone', profile.phone || '');
      setValue('contactEmail', profile.contactEmail || currentUser?.email || '');
      setValue('bankName', profile.bankName || '');
      setValue('bankAccountNumber', profile.bankAccountNumber || '');
      setValue('bankAccountHolder', profile.bankAccountHolder || '');
      setValue('bio', profile.bio || '');
      setValue('portfolioUrl', profile.portfolioUrl || '');

      if (profile.otpVerifiedAt) {
        setIsOtpVerified(true);
        setIsOtpSent(true);
      }
      if (profile.contactEmail) {
        setOtpEmail(profile.contactEmail);
      }
    }
  }, [profile, currentUser, setValue]);

  // Cooldown countdown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Mutations
  const sendOtpMutation = useMutation({
    mutationFn: (email: string) => kycApi.sendEmailOtp({ email }),
    onSuccess: () => {
      setIsOtpSent(true);
      setOtpCooldown(60);
      setOtpMessage({
        type: 'success',
        text: 'Mã xác thực OTP đã được gửi đến hộp thư của bạn. Vui lòng kiểm tra mã trong vòng 5 phút.',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể gửi mã OTP. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setOtpMessage({ type: 'error', text: msg });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (variables: { email: string; otpCode: string }) =>
      kycApi.verifyEmailOtp(variables),
    onSuccess: () => {
      setIsOtpVerified(true);
      setValue('contactEmail', otpEmail);
      setOtpMessage({
        type: 'success',
        text: 'Xác thực email thành công! Bạn có thể tiếp tục hoàn thiện thông tin hồ sơ bên dưới.',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Mã xác thực OTP không chính xác hoặc đã hết hạn.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setOtpMessage({ type: 'error', text: msg });
    },
  });

  const submitKycMutation = useMutation({
    mutationFn: (data: KycFormData) => {
      return kycApi.submitKyc({
        fullName: data.fullName,
        phone: data.phone,
        contactEmail: data.contactEmail,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountHolder: data.bankAccountHolder.toUpperCase(),
        bio: data.bio || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'kyc-profile'] });
      setIsEditingResubmit(false);
    },
    onError: (err: unknown) => {
      let msg = 'Nộp hồ sơ thất bại. Vui lòng kiểm tra lại thông tin.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSendOtp = () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      setOtpMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ email hợp lệ trước khi gửi mã OTP' });
      return;
    }
    setOtpMessage(null);
    sendOtpMutation.mutate(otpEmail);
  };

  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage({ type: 'error', text: 'Mã OTP phải bao gồm đúng 6 chữ số' });
      return;
    }
    setOtpMessage(null);
    verifyOtpMutation.mutate({ email: otpEmail, otpCode });
  };

  const onSubmit = (data: KycFormData) => {
    setSubmitError(null);
    if (!isOtpVerified && !profile?.otpVerifiedAt) {
      setSubmitError('Vui lòng hoàn tất xác thực OTP email trước khi nộp hồ sơ.');
      return;
    }
    submitKycMutation.mutate(data);
  };

  // Loading Gate Skeleton
  if (isCheckingGate) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface rounded-xl border border-border" />
        <div className="h-96 bg-surface rounded-xl border border-border" />
      </div>
    );
  }

  // 1. STATE APPROVED
  if (isApproved && profile && !isEditingResubmit) {
    return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-status-success-text mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Định Danh Tác Giả Chính Thức</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Hồ Sơ KYC Đã Được Phê Duyệt
          </h1>
          <p className="mt-2 text-sm text-muted">
            Tài khoản của bạn đã được Ban Quản trị Sử Ký xác thực đầy đủ tư cách Nhà sáng tạo nội dung.
          </p>
        </div>

        {/* Success Certificate Banner */}
        <div className="rounded-xl border border-status-success-text/30 bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-status-success-text" />
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-status-success-bg text-status-success-text border border-status-success-text/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-3 py-1 text-xs font-bold text-status-success-text border border-status-success-text/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ĐÃ PHÊ DUYỆT (APPROVED)
                </span>
                <span className="text-xs font-mono text-muted">Hồ sơ #{profile.id}</span>
              </div>

              <h2 className="font-serif text-xl font-bold text-ink">
                Chào mừng Nhà sáng tạo {profile.fullName}
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Bạn đã đủ điều kiện xuất bản tác phẩm và quản lý kênh podcast. Mọi khoản thù lao nhuận bút và phân phối tác quyền sẽ được thanh toán về tài khoản ngân hàng đã đăng ký.
              </p>

              <div className="pt-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/creator/channel')}
                  className="gap-2 shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Đến Không Gian Quản Lý Kênh</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              <span>Thông tin định danh đã xác thực</span>
            </h3>
            <span className="text-xs text-muted">
              Xác thực lúc: {profile.otpVerifiedAt ? new Date(profile.otpVerifiedAt).toLocaleDateString('vi-VN') : 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Họ và tên tác giả</span>
              <span className="font-semibold text-ink text-sm block">{profile.fullName}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Email liên hệ đã xác minh</span>
              <span className="font-mono font-medium text-ink block">{profile.contactEmail || profile.userEmail}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Số điện thoại</span>
              <span className="font-mono font-medium text-ink block">{profile.phone || 'Chưa cập nhật'}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Ngân hàng thụ hưởng</span>
              <span className="font-medium text-ink block">{profile.bankName || 'N/A'}</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Số tài khoản ngân hàng</span>
              <span className="font-mono font-medium text-ink block">
                {profile.bankAccountNumber ? maskAccountNumber(profile.bankAccountNumber) : 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Chủ tài khoản thụ hưởng</span>
              <span className="font-mono font-semibold text-ink uppercase block">{profile.bankAccountHolder || 'N/A'}</span>
            </div>
          </div>

          {profile.bio && (
            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Tiểu sử tác giả</span>
              <p className="text-xs text-ink leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.portfolioUrl && (
            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Hồ sơ năng lực / Kênh cá nhân</span>
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-accent hover:underline break-all block"
              >
                {profile.portfolioUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. STATE PENDING
  if (isPending && profile && !isEditingResubmit) {
    return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 mb-2">
            <Clock className="h-4 w-4" />
            <span>Đang Thẩm Định Sử Liệu & Pháp Lý</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Hồ Sơ Đang Chờ Phê Duyệt
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hồ sơ KYC của bạn đã được ghi nhận trên hệ thống và đang trong hàng đợi xét duyệt bởi Ban Quản trị Sử Ký.
          </p>
        </div>

        {/* Pending Card */}
        <div className="rounded-xl border border-amber-300/40 bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  CHỜ DUYỆT (PENDING)
                </span>
                <span className="text-xs font-mono text-muted">Mã hồ sơ: #{profile.id}</span>
              </div>

              <h2 className="font-serif text-xl font-bold text-ink">
                Hồ sơ của bạn đang được xử lý
              </h2>
              <p className="text-sm text-muted leading-relaxed max-w-2xl">
                Quy trình thẩm định tư cách nhà sáng tạo đảm bảo các yêu cầu về tính chuẩn mực sử học và xác thực pháp lý tài khoản thanh toán. Ban Biên tập Sử Ký thường phản hồi trong vòng <strong>24 – 48 giờ làm việc (thời gian xử lý dự kiến)</strong>.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Làm mới trạng thái</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Data Review Table */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
            <FileText className="h-4 w-4 text-accent" />
            <span>Thông tin đã gửi xét duyệt</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Họ và tên tác giả</span>
              <span className="font-semibold text-ink">{profile.fullName}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Email liên hệ</span>
              <span className="font-mono text-ink">{profile.contactEmail}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Số điện thoại</span>
              <span className="font-mono text-ink">{profile.phone}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Ngân hàng thụ hưởng</span>
              <span className="font-medium text-ink">{profile.bankName}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Số tài khoản</span>
              <span className="font-mono text-ink">
                {profile.bankAccountNumber ? maskAccountNumber(profile.bankAccountNumber) : 'N/A'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <span className="text-muted block text-[11px]">Chủ tài khoản</span>
              <span className="font-mono uppercase text-ink">{profile.bankAccountHolder}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. STATE REJECTED (when not currently editing)
  if (isRejected && profile && !isEditingResubmit) {
    return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-status-error-text mb-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Kết Quả Xét Duyệt KYC</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Hồ Sơ Cần Điều Chỉnh
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hồ sơ đăng ký Nhà sáng tạo của bạn chưa được duyệt. Bạn có thể xem lý do chi tiết dưới đây và nộp lại hồ sơ sau khi chỉnh sửa.
          </p>
        </div>

        {/* Rejection Alert */}
        <div className="rounded-xl border border-status-error-text/30 bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-status-error-text" />
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-status-error-bg text-status-error-text border border-status-error-text/20">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-error-bg px-3 py-1 text-xs font-bold text-status-error-text border border-status-error-text/20">
                  <AlertCircle className="h-3.5 w-3.5" />
                  BỊ TỪ CHỐI (REJECTED)
                </span>
                <span className="text-xs font-mono text-muted">Hồ sơ #{profile.id}</span>
              </div>

              <h2 className="font-serif text-xl font-bold text-ink">
                Lý do từ chối từ Ban Biên tập Sử Ký
              </h2>

              <div className="rounded-lg border border-status-error-text/20 bg-status-error-bg/30 p-4 max-w-2xl">
                <p className="text-sm font-medium text-ink italic leading-relaxed">
                  "{rejectionReason || 'Thông tin tài khoản hoặc định danh chưa đầy đủ, vui lòng bổ sung.'}"
                </p>
              </div>

              <p className="text-xs text-muted leading-relaxed max-w-2xl">
                Hệ thống Sử Ký cho phép bạn cập nhật lại thông tin hồ sơ và gửi lại ngay lập tức mà không cần tạo tài khoản mới.
              </p>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsEditingResubmit(true)}
                  className="gap-2 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Chỉnh sửa và Nộp lại hồ sơ</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. ONBOARDING / SUBMIT FORM (No Profile, Draft, or Editing Resubmit)
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
          <UserCheck className="h-4 w-4" />
          <span>Quy Trình Định Danh Tác Giả</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
          {isEditingResubmit ? 'Cập Nhật & Nộp Lại Hồ Sơ KYC' : 'Đăng Ký Định Danh Nhà Sáng Tạo (KYC)'}
        </h1>
        <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
          Hoàn tất xác thực danh tính để kích hoạt tính năng tạo kênh podcast, xuất bản các tác phẩm lịch sử và nhận quyền lợi tác giả trên Sử Ký.
        </p>
      </div>

      {isEditingResubmit && rejectionReason && (
        <div className="rounded-lg border border-status-error-text/20 bg-status-error-bg/40 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-status-error-text shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-status-error-text block">Lưu ý chỉnh sửa:</span>
            <p className="text-ink italic">"{rejectionReason}"</p>
          </div>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* STEP 1: OTP Email Verification */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-canvas text-xs font-bold">
                1
              </span>
              <h3 className="font-serif text-base font-bold text-ink">
                Xác thực địa chỉ Email liên hệ qua mã OTP
              </h3>
            </div>
            {isOtpVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text border border-status-success-text/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã xác thực OTP
              </span>
            )}
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Hệ thống sẽ gửi mã số bảo mật 6 chữ số đến địa chỉ email này để xác nhận quyền sở hữu hộp thư tác giả.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-ink block">
                Địa chỉ Email xác thực <span className="text-accent">*</span>
              </label>
              <Input
                type="email"
                value={otpEmail}
                onChange={(e) => {
                  setOtpEmail(e.target.value);
                  setIsOtpVerified(false);
                }}
                disabled={isOtpVerified || sendOtpMutation.isPending}
                placeholder="tacgia@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant={isOtpVerified ? 'secondary' : 'primary'}
                onClick={handleSendOtp}
                disabled={sendOtpMutation.isPending || otpCooldown > 0 || isOtpVerified}
                isLoading={sendOtpMutation.isPending}
                className="w-full gap-2"
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
            <div className="pt-2 border-t border-border/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-ink block">
                    Nhập mã OTP 6 chữ số <span className="text-accent">*</span>
                  </label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="font-mono text-base tracking-widest text-center sm:text-left"
                    leftIcon={<Lock className="h-4 w-4" />}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleVerifyOtp}
                    disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
                    isLoading={verifyOtpMutation.isPending}
                    className="w-full gap-2"
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
              className={`rounded-lg p-3 text-xs flex items-start gap-2.5 ${
                otpMessage.type === 'success'
                  ? 'bg-status-success-bg text-status-success-text border border-status-success-text/30'
                  : 'bg-status-error-bg text-status-error-text border border-status-error-text/30'
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
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-canvas text-xs font-bold">
              2
            </span>
            <h3 className="font-serif text-base font-bold text-ink">
              Thông tin định danh tác giả & Tài khoản nhận nhuận bút
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink block">
                Họ và tên tác giả đầy đủ <span className="text-accent">*</span>
              </label>
              <Input
                {...register('fullName')}
                placeholder="Nguyễn Văn An"
                error={Boolean(errors.fullName)}
                leftIcon={<User className="h-4 w-4" />}
              />
              {errors.fullName && (
                <p className="text-[11px] text-status-error-text">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink block">
                Số điện thoại liên hệ <span className="text-accent">*</span>
              </label>
              <Input
                {...register('phone')}
                placeholder="0912345678"
                error={Boolean(errors.phone)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
              {errors.phone && (
                <p className="text-[11px] text-status-error-text">{errors.phone.message}</p>
              )}
            </div>

            {/* Contact Email (Read-only, matches OTP verified email) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-ink block">
                Email liên hệ chính thức (Trùng với email đã xác thực OTP) <span className="text-accent">*</span>
              </label>
              <Input
                {...register('contactEmail')}
                readOnly
                className="bg-surface-subtle cursor-not-allowed font-mono text-muted"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-ink block">
                Tên Ngân hàng thụ hưởng <span className="text-accent">*</span>
              </label>
              <input
                {...register('bankName')}
                list="popular-banks"
                placeholder="Chọn hoặc nhập tên ngân hàng (vd: Vietcombank, MB Bank...)"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-ink-muted/70 rounded-lg border border-border focus:outline-none focus:bg-surface focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent"
              />
              <datalist id="popular-banks">
                {POPULAR_VIETNAMESE_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {errors.bankName && (
                <p className="text-[11px] text-status-error-text">{errors.bankName.message}</p>
              )}
            </div>

            {/* Bank Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink block">
                Số tài khoản ngân hàng <span className="text-accent">*</span>
              </label>
              <Input
                {...register('bankAccountNumber')}
                placeholder="0011001234567"
                error={Boolean(errors.bankAccountNumber)}
                leftIcon={<CreditCard className="h-4 w-4" />}
              />
              {errors.bankAccountNumber && (
                <p className="text-[11px] text-status-error-text">
                  {errors.bankAccountNumber.message}
                </p>
              )}
            </div>

            {/* Bank Account Holder */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink block">
                Tên chủ tài khoản (Viết in hoa không dấu) <span className="text-accent">*</span>
              </label>
              <Input
                {...register('bankAccountHolder')}
                placeholder="NGUYEN VAN AN"
                className="uppercase"
                error={Boolean(errors.bankAccountHolder)}
                leftIcon={<User className="h-4 w-4" />}
              />
              {errors.bankAccountHolder && (
                <p className="text-[11px] text-status-error-text">
                  {errors.bankAccountHolder.message}
                </p>
              )}
            </div>

            {/* Bio (Optional) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-ink block">
                Tiểu sử & Phong cách nghiên cứu lịch sử (Không bắt buộc)
              </label>
              <Textarea
                {...register('bio')}
                placeholder="Giới thiệu sơ lược về định hướng nội dung podcast, giai đoạn lịch sử bạn quan tâm..."
                rows={3}
                error={Boolean(errors.bio)}
              />
              {errors.bio && (
                <p className="text-[11px] text-status-error-text">{errors.bio.message}</p>
              )}
            </div>

            {/* Portfolio URL (Optional) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-ink block">
                Liên kết Hồ sơ năng lực / Kênh cá nhân (Không bắt buộc)
              </label>
              <Input
                {...register('portfolioUrl')}
                placeholder="https://facebook.com/trangtacgia hoặc https://youtube.com/..."
                error={Boolean(errors.portfolioUrl)}
                leftIcon={<Globe className="h-4 w-4" />}
              />
              {errors.portfolioUrl && (
                <p className="text-[11px] text-status-error-text">{errors.portfolioUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* STEP 3: Terms & Submission */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-canvas text-xs font-bold">
              3
            </span>
            <h3 className="font-serif text-base font-bold text-ink">
              Cam kết trách nhiệm & Gửi hồ sơ
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('agreeTerms')}
                className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-xs text-ink/90 leading-relaxed">
                Tôi cam kết mọi thông tin định danh và tài khoản ngân hàng trên là hoàn toàn chính xác. Tôi đồng ý tuân thủ <strong>Quy chuẩn Biên tập & Tiêu chuẩn Sử học Sử Ký</strong>, không phổ biến nội dung xuyên tạc lịch sử dân tộc.
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-[11px] text-status-error-text pl-7">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>

          {submitError && (
            <div className="rounded-lg p-3 bg-status-error-bg text-status-error-text border border-status-error-text/30 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{submitError}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitKycMutation.isPending || (!isOtpVerified && !profile?.otpVerifiedAt)}
              isLoading={submitKycMutation.isPending}
              className="gap-2 shadow-sm"
            >
              <Send className="h-4 w-4" />
              <span>{isEditingResubmit ? 'Nộp lại hồ sơ KYC' : 'Nộp hồ sơ xét duyệt Creator'}</span>
            </Button>

            {isEditingResubmit && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsEditingResubmit(false)}
              >
                Hủy chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
