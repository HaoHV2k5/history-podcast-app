import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gsap } from 'gsap';

import { useAuthStore } from '@/store/authStore';
import { kycApi } from '@/services/api/kyc';
import { useKycGate } from './useKycGate';
import { KycProfile } from '@/types/kyc';
import { createSafeMotionContext, MOTION_CONFIG } from '@/utils/motion';

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

export const CreatorKycPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const containerRef = useRef<HTMLDivElement>(null);

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
      <div className="space-y-6 sm:space-y-8 animate-pulse w-full">
        <div className="h-36 bg-[#FDFBF7] rounded-2xl border border-[#EBE4D8]" />
        <div className="h-44 bg-[#F4F9F6] rounded-2xl border border-[#C8DFD2]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-[#EBE4D8]" />
          <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-[#EBE4D8]" />
        </div>
      </div>
    );
  }

  // 1. STATE APPROVED (Matches reference image 100%)
  if (isApproved && profile && !isEditingResubmit) {
    return (
      <div ref={containerRef} className="space-y-3 sm:space-y-3.5 w-full">
        {/* Top Historical Landscape Header */}
        <KycHeaderBanner status="APPROVED" />

        {/* Hero Callout Card with Ancient Decree Scroll & Seal */}
        <KycApprovedHero
          profile={profile}
          onGoToChannel={() => navigate('/creator/channel')}
        />

        {/* 2-Column Content Grid: Verified Info (8 cols) + Benefits (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-start">
          {/* Left Column: 6-Field Verified Info + Bio + Portfolio */}
          <div className="lg:col-span-8 min-w-0">
            <KycVerifiedInfoGrid
              profile={profile}
              onEditBio={() => setIsBioModalOpen(true)}
            />
          </div>

          {/* Right Column: Benefits Card */}
          <div className="lg:col-span-4 min-w-0">
            <KycBenefitsCard />
          </div>
        </div>

        {/* Bottom Full-width Security & Privacy Guarantee */}
        <KycSecurityBanner onOpenSecurity={() => setIsSecurityModalOpen(true)} />

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

  // 2. STATE PENDING
  if (isPending && profile && !isEditingResubmit) {
    return (
      <div ref={containerRef} className="space-y-3 sm:space-y-3.5 w-full">
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

  // 3. STATE REJECTED
  if (isRejected && profile && !isEditingResubmit) {
    return (
      <div ref={containerRef} className="space-y-3 sm:space-y-3.5 w-full">
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

  // 4. ONBOARDING / SUBMISSION FORM
  return (
    <div ref={containerRef} className="space-y-3 sm:space-y-3.5 w-full">
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

      {/* Security Modal */}
      <KycSecurityModal
        open={isSecurityModalOpen}
        onOpenChange={setIsSecurityModalOpen}
      />
    </div>
  );
};
