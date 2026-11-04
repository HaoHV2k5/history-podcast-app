import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gsap } from 'gsap';
import {
  FileCheck2,
  Crown,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Radio,
  Headphones,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { kycApi } from '@/services/api/kyc';
import { useKycGate } from './useKycGate';
import { KycProfile } from '@/types/kyc';
import { createSafeMotionContext, MOTION_CONFIG } from '@/utils/motion';
import { AnimatedTabs, useTabContentAnimation, TabItem } from '@/components/common/AnimatedTabs';

// Compound Components
import { KycHeaderBanner } from './components/KycHeaderBanner';
import { KycApprovedHero } from './components/KycApprovedHero';
import { KycVerifiedInfoGrid } from './components/KycVerifiedInfoGrid';
import { KycBenefitsCard } from './components/KycBenefitsCard';
import { KycSecurityBanner } from './components/KycSecurityBanner';
import { KycPendingView } from './components/KycPendingView';
import { KycRejectedView } from './components/KycRejectedView';
import { KycFormView, KycFormData } from './components/KycFormView';

// Interactive Modals
import { KycSecurityModal } from './components/KycSecurityModal';
import { KycBioEditModal } from './components/KycBioEditModal';

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

export type KycApprovedTabKey = 'profile' | 'benefits' | 'security';

export const CreatorKycPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Synchronized Tab State for Approved View
  const [activeApprovedTab, setActiveApprovedTab] = useState<KycApprovedTabKey>('profile');

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

  // Modals state
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);

  // OTP State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form setup
  const form = useForm<KycFormData>({
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

  const { setValue } = form;

  // Keep OTP email in sync with contact email
  useEffect(() => {
    if (currentUser?.email && !otpEmail) {
      setOtpEmail(currentUser.email);
      setValue('contactEmail', currentUser.email);
    }
  }, [currentUser, otpEmail, setValue]);

  // Pre-fill values if profile exists
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

  // OTP Cooldown Timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // GSAP 60fps Entrance Motion with prefers-reduced-motion check
  useEffect(() => {
    if (!containerRef.current || isCheckingGate) return;

    const cleanup = createSafeMotionContext(containerRef, () => {
      const targets = containerRef.current?.querySelectorAll('[data-motion-target]');
      if (!targets || targets.length === 0) return;

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: MOTION_CONFIG.distance.md,
        },
        {
          opacity: 1,
          y: 0,
          duration: MOTION_CONFIG.duration.dashboardCards,
          ease: MOTION_CONFIG.ease,
          stagger: MOTION_CONFIG.duration.stagger,
          clearProps: 'transform',
        }
      );
    });

    return cleanup;
  }, [isCheckingGate, isApproved, isPending, isRejected, isEditingResubmit]);

  // GSAP Tab Content Switching Crossfade for Approved view
  useTabContentAnimation(tabContentRef, activeApprovedTab);

  // OTP Mutations
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

  const handleSendOtp = () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      setOtpMessage({
        type: 'error',
        text: 'Vui lòng nhập địa chỉ email hợp lệ trước khi gửi mã OTP',
      });
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

  const handleSaveBio = async (newBio: string, newPortfolioUrl: string) => {
    if (profile) {
      const updatedProfile: KycProfile = {
        ...profile,
        bio: newBio,
        portfolioUrl: newPortfolioUrl,
      };
      // Optimistic update
      queryClient.setQueryData(['creator', 'kyc-profile'], {
        data: updatedProfile,
      });

      try {
        await kycApi.submitKyc({
          fullName: profile.fullName,
          phone: profile.phone || '',
          contactEmail: profile.contactEmail || profile.userEmail || '',
          bankName: profile.bankName || '',
          bankAccountNumber: profile.bankAccountNumber || '',
          bankAccountHolder: profile.bankAccountHolder || '',
          bio: newBio,
          portfolioUrl: newPortfolioUrl,
        });
      } catch {
        // Keep optimistic update
      }
    }
  };

  // Loading Gate Skeleton
  if (isCheckingGate) {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-7xl mx-auto">
        <div className="h-32 bg-[#FDFBF7] rounded-2xl border border-[#EBE4D8]" />
        <div className="h-40 bg-[#F4F9F6] rounded-2xl border border-[#C8DFD2]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-white rounded-2xl border border-[#EBE4D8]" />
          <div className="lg:col-span-4 h-80 bg-white rounded-2xl border border-[#EBE4D8]" />
        </div>
      </div>
    );
  }

  // ─── 1. STATE APPROVED (With Synchronized Tabs & GSAP Motion) ──────────────
  if (isApproved && profile && !isEditingResubmit) {
    const APPROVED_TABS: TabItem[] = [
      {
        id: 'profile',
        label: 'Hồ sơ đã duyệt',
        icon: <FileCheck2 className="h-4 w-4" />,
        badge: 'Đã xác thực',
      },
      {
        id: 'benefits',
        label: 'Đặc quyền Creator',
        icon: <Crown className="h-4 w-4" />,
      },
      {
        id: 'security',
        label: 'Bảo mật & Pháp lý',
        icon: <ShieldCheck className="h-4 w-4" />,
      },
    ];

    return (
      <div ref={containerRef} className="space-y-6 w-full max-w-7xl mx-auto pb-12">
        {/* Top Historical Landscape Header */}
        <KycHeaderBanner status="APPROVED" />

        {/* Hero Callout Card with Ancient Decree Scroll & Seal */}
        <KycApprovedHero
          profile={profile}
          onGoToChannel={() => navigate('/creator/channel')}
        />

        {/* Synchronized Tab Navigation with Sliding GSAP Indicator */}
        <div data-motion-target="tabs" className="bg-white rounded-2xl border border-[#EBE4D8] px-4 pt-1 shadow-2xs">
          <AnimatedTabs
            tabs={APPROVED_TABS}
            activeTab={activeApprovedTab}
            onTabChange={(id) => setActiveApprovedTab(id as KycApprovedTabKey)}
          />
        </div>

        {/* Tab Content Panels */}
        <div ref={tabContentRef} className="space-y-6">
          {/* TAB 1: HỒ SƠ ĐÃ DUYỆT (VERIFIED PROFILE) */}
          {activeApprovedTab === 'profile' && (
            <div data-tab-content className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 6-Field Verified Info + Bio + Portfolio (8 cols) */}
              <div className="lg:col-span-8 space-y-6 min-w-0">
                <KycVerifiedInfoGrid
                  profile={profile}
                  onEditBio={() => setIsBioModalOpen(true)}
                />

                {/* Quick Channel Management Shortcut */}
                <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1">
                    <h4 className="font-serif text-sm font-bold text-[#1C1615]">
                      Sẵn sàng phát triển kênh Podcast chính thức?
                    </h4>
                    <p className="text-xs text-[#5C524F] leading-relaxed">
                      Thiết lập nhận diện, định vị chủ đề và cấu hình gói hội viên VIP để bắt đầu tạo doanh thu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/creator/channel')}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] hover:bg-[#F3EFE6] px-4 py-2 text-xs font-semibold text-[#1C1615] transition-all cursor-pointer shrink-0"
                  >
                    <span>Quản lý kênh</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#A31D24]" />
                  </button>
                </div>
              </div>

              {/* Right Column: Benefits Overview Card (4 cols) */}
              <div className="lg:col-span-4 space-y-6 min-w-0">
                <KycBenefitsCard />
                <KycSecurityBanner onOpenSecurity={() => setIsSecurityModalOpen(true)} />
              </div>
            </div>
          )}

          {/* TAB 2: ĐẶC QUYỀN CREATOR (PRIVILEGES) */}
          {activeApprovedTab === 'benefits' && (
            <div data-tab-content className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 space-y-2.5 shadow-2xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#A31D24] border border-[#EBE4D8]">
                    <Radio className="h-4 w-4" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#1C1615]">
                    Khởi tạo Kênh Podcast
                  </h4>
                  <p className="text-xs text-[#5C524F] leading-relaxed">
                    Mở khóa quyền sở hữu 1 kênh podcast độc quyền gắn liền với danh xưng và mã định danh của bạn.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 space-y-2.5 shadow-2xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDF2F2] text-[#A31D24] border border-[#F9D2D4]">
                    <Crown className="h-4 w-4" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#1C1615]">
                    Gói Hội Viên VIP & Nhuận Bút
                  </h4>
                  <p className="text-xs text-[#5C524F] leading-relaxed">
                    Thu phí đăng ký hàng tháng từ thính giả trung thành, nhận 90% doanh thu tự động về ví khả dụng.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 space-y-2.5 shadow-2xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#168A4E] border border-emerald-200">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#1C1615]">
                    Creator Studio & Livestream
                  </h4>
                  <p className="text-xs text-[#5C524F] leading-relaxed">
                    Sử dụng toàn bộ công cụ tổng hợp giọng đọc AI, biên tập phân cảnh và phòng phát sóng trực tiếp.
                  </p>
                </div>
              </div>

              <KycBenefitsCard />
            </div>
          )}

          {/* TAB 3: BẢO MẬT & PHÁP LÝ (SECURITY & TERMS) */}
          {activeApprovedTab === 'security' && (
            <div data-tab-content className="space-y-6">
              <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#F0EBE1] pb-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#A31D24] border border-[#EBE4D8]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1C1615]">
                      Cam kết Bảo mật & Bảo chứng Quyền tác giả
                    </h3>
                    <p className="text-xs text-[#786D66]">
                      Hệ thống Sử Ký tuân thủ nghiêm ngặt Luật An toàn thông tin mạng và Luật Sở hữu trí tuệ Việt Nam.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                    <span className="font-bold text-[#1C1615] block">Bảo mật tài khoản ngân hàng</span>
                    <p className="text-[#5C524F] leading-relaxed">
                      Thông tin số tài khoản chỉ sử dụng để đối soát chi trả nhuận bút, mã hóa ở tầng cơ sở dữ liệu.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                    <span className="font-bold text-[#1C1615] block">Bảo vệ quyền tác giả</span>
                    <p className="text-[#5C524F] leading-relaxed">
                      Mỗi tác phẩm phát hành được gắn dấu xác thực số (digital footprint) định danh quyền sở hữu của bạn.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                    <span className="font-bold text-[#1C1615] block">Không chia sẻ bên thứ ba</span>
                    <p className="text-[#5C524F] leading-relaxed">
                      Dữ liệu cá nhân tuyệt đối không cung cấp cho bất kỳ đơn vị quảng cáo hay tiếp thị nào.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] hover:bg-[#F3EFE6] px-4 py-2 text-xs font-semibold text-[#1C1615] transition-all cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-[#A31D24]" />
                    <span>Xem toàn văn cam kết an toàn dữ liệu</span>
                  </button>
                </div>
              </div>

              <KycSecurityBanner onOpenSecurity={() => setIsSecurityModalOpen(true)} />
            </div>
          )}
        </div>

        {/* Interactive Modals */}
        <KycSecurityModal
          open={isSecurityModalOpen}
          onOpenChange={setIsSecurityModalOpen}
        />
        <KycBioEditModal
          open={isBioModalOpen}
          onOpenChange={setIsBioModalOpen}
          profile={profile}
          onSaveBio={handleSaveBio}
        />
      </div>
    );
  }

  // ─── 2. STATE PENDING ───────────────────────────────────────────────────────
  if (isPending && profile && !isEditingResubmit) {
    return (
      <div ref={containerRef} className="space-y-6 w-full max-w-7xl mx-auto pb-12">
        <KycHeaderBanner status="PENDING" />
        <KycPendingView
          profile={profile}
          onRefresh={() => refetch()}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
        />
        <KycSecurityModal
          open={isSecurityModalOpen}
          onOpenChange={setIsSecurityModalOpen}
        />
      </div>
    );
  }

  // ─── 3. STATE REJECTED ──────────────────────────────────────────────────────
  if (isRejected && profile && !isEditingResubmit) {
    return (
      <div ref={containerRef} className="space-y-6 w-full max-w-7xl mx-auto pb-12">
        <KycHeaderBanner status="REJECTED" />
        <KycRejectedView
          profile={profile}
          rejectionReason={rejectionReason}
          onStartResubmit={() => setIsEditingResubmit(true)}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
        />
        <KycSecurityModal
          open={isSecurityModalOpen}
          onOpenChange={setIsSecurityModalOpen}
        />
      </div>
    );
  }

  // ─── 4. ONBOARDING / SUBMISSION FORM ────────────────────────────────────────
  return (
    <div ref={containerRef} className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      <KycHeaderBanner
        status="FORM"
        customTitle={
          isEditingResubmit
            ? 'Cập Nhật & Nộp Lại Hồ Sơ KYC'
            : 'Đăng Ký Định Danh Nhà Sáng Tạo (KYC)'
        }
      />

      <KycFormView
        form={form}
        onSubmit={onSubmit}
        otpEmail={otpEmail}
        setOtpEmail={setOtpEmail}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpCooldown={otpCooldown}
        isOtpSent={isOtpSent}
        isOtpVerified={isOtpVerified}
        setIsOtpVerified={setIsOtpVerified}
        otpMessage={otpMessage}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        isSendingOtp={sendOtpMutation.isPending}
        isVerifyingOtp={verifyOtpMutation.isPending}
        isSubmitting={submitKycMutation.isPending}
        submitError={submitError}
        isEditingResubmit={isEditingResubmit}
        onCancelResubmit={() => setIsEditingResubmit(false)}
        rejectionReason={rejectionReason}
      />

      {/* Security Commitment Banner */}
      <KycSecurityBanner onOpenSecurity={() => setIsSecurityModalOpen(true)} />

      {/* Security Modal */}
      <KycSecurityModal
        open={isSecurityModalOpen}
        onOpenChange={setIsSecurityModalOpen}
      />
    </div>
  );
};
