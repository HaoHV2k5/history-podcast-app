import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  LayoutDashboard,
  Sliders,
  Crown,
  Headphones,
  Radio,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Eye,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

import { useKycGate } from '@/features/kyc/useKycGate';
import { KycGateCard } from '@/features/kyc/KycGateCard';
import { channelsApi } from '@/services/api/channels';
import { membershipApi } from '@/services/api/membership';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { ChannelItem } from '@/types/channel';
import { MembershipPlanRequest } from '@/types/membership';
import { CreatorVideoItem } from '@/types/creatorContent';
import { createSafeMotionContext, MOTION_CONFIG } from '@/utils/motion';
import { AnimatedTabs, useTabContentAnimation, TabItem } from '@/components/common/AnimatedTabs';
import { formatVND } from '@/utils/formatters';

// Compound Components
import { ChannelHeaderBanner } from './components/ChannelHeaderBanner';
import { ChannelShowcaseCard } from './components/ChannelShowcaseCard';
import {
  ChannelMetadataFormCard,
  ChannelMetadataFormCardRef,
  ChannelUpdateFormData,
} from './components/ChannelMetadataFormCard';
import { ChannelMembershipPlanCard } from './components/ChannelMembershipPlanCard';
import { ChannelPreviewSidebarCard } from './components/ChannelPreviewSidebarCard';
import { ChannelTipsCard } from './components/ChannelTipsCard';
import { ChannelHelpCard } from './components/ChannelHelpCard';
import { ChannelSupportModal } from './components/ChannelSupportModal';
import { ChannelPlatformPreviewModal } from './components/ChannelPlatformPreviewModal';
import { ChannelCreateView, ChannelCreateFormData } from './components/ChannelCreateView';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type ChannelTabKey = 'overview' | 'info' | 'membership' | 'support';

export const CreatorChannelPage: React.FC = () => {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const metadataFormRef = useRef<ChannelMetadataFormCardRef>(null);

  // ─── 0. Active Tab State with Synchronized Navigation ───────────────────────
  const [activeTab, setActiveTab] = useState<ChannelTabKey>('overview');

  // ─── 1. Check KYC Gate ──────────────────────────────────────────────────────
  const {
    status: kycStatus,
    isApproved: isKycApproved,
    rejectionReason,
    isLoading: isCheckingKyc,
    isError: isKycError,
    errorMessage: kycErrorMessage,
    refetch: refetchKyc,
  } = useKycGate();

  // ─── 2. Query My Channel ───────────────────────────────────────────────────
  const {
    data: channel,
    isLoading: isLoadingChannel,
    isError: isChannelError,
    error: channelError,
    refetch: refetchChannel,
  } = useQuery({
    queryKey: ['creator', 'my-channel'],
    queryFn: async (): Promise<ChannelItem | null> => {
      try {
        const res = await channelsApi.getMyChannel();
        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // 404 indicates creator has not created a channel yet
          return null;
        }
        throw err;
      }
    },
    enabled: isKycApproved,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 60 * 1000,
  });

  // ─── 3. Query Membership Plan ──────────────────────────────────────────────
  const { data: planRes } = useQuery({
    queryKey: ['creator-channel-plan', channel?.id],
    queryFn: () => membershipApi.getChannelPlan(channel!.id),
    enabled: Boolean(channel?.id),
    retry: 1,
  });
  const currentPlan = planRes?.data || null;

  // ─── 4. Query Creator Podcasts & Videos (Real Data) ────────────────────────
  const { data: videosRes } = useQuery({
    queryKey: ['creator-studio-videos'],
    queryFn: () => creatorStudioApi.getVideos(),
    enabled: Boolean(channel?.id),
    staleTime: 30 * 1000,
  });
  const creatorVideos: CreatorVideoItem[] = Array.isArray(videosRes?.data) ? videosRes.data : [];

  // 100% Real metrics from system database (strictly zero fake data)
  const totalEpisodes = creatorVideos.length;
  const completedEpisodes = creatorVideos.filter(
    (v) => v.status === 'COMPLETED' || v.status === 'PUBLISHED'
  ).length;

  // ─── 5. UI Feedback & Modal States ─────────────────────────────────────────
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // File Upload Previews (for onboarding form)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // ─── 6. GSAP Motion Layers ─────────────────────────────────────────────────
  // 6.1. Initial Entrance Animation
  useEffect(() => {
    if (!containerRef.current || isCheckingKyc || isLoadingChannel) return;

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
  }, [isCheckingKyc, isLoadingChannel, channel?.id]);

  // 6.2. Tab Content Switching GSAP Crossfade
  useTabContentAnimation(tabContentRef, activeTab);

  // ─── 7. File Validation Helper ─────────────────────────────────────────────
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Định dạng ảnh không được hỗ trợ. Vui lòng chọn file JPG, PNG hoặc WEBP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Kích thước ảnh vượt quá 10MB. Vui lòng chọn file nhẹ hơn.';
    }
    return null;
  };

  const handleOnboardingFileSelect = (
    file: File | undefined,
    type: 'avatar' | 'cover'
  ) => {
    setErrorMessage(null);
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(objectUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(objectUrl);
    }
  };

  // ─── 8. Mutations ──────────────────────────────────────────────────────────
  // 8.1. Create Channel Mutation (Onboarding)
  const createChannelMutation = useMutation({
    mutationFn: async (data: ChannelCreateFormData) => {
      const res = await channelsApi.createChannel({
        name: data.name,
        description: data.description,
      });

      let avatarFailed = false;
      let coverFailed = false;

      if (avatarFile) {
        try {
          await channelsApi.uploadAvatar(avatarFile);
        } catch (e) {
          console.warn('Avatar upload failed during creation:', e);
          avatarFailed = true;
        }
      }

      if (coverFile) {
        try {
          await channelsApi.uploadCover(coverFile);
        } catch (e) {
          console.warn('Cover upload failed during creation:', e);
          coverFailed = true;
        }
      }

      return { channel: res.data, avatarFailed, coverFailed };
    },
    onSuccess: (result) => {
      if (result.avatarFailed || result.coverFailed) {
        setSuccessToast(
          'Khởi tạo kênh thành công! Một số hình ảnh tải lên có thể cần cập nhật lại sau.'
        );
      } else {
        setSuccessToast('Khởi tạo kênh Podcast Sử Ký thành công!');
      }
      queryClient.invalidateQueries({ queryKey: ['creator', 'my-channel'] });
      setAvatarFile(null);
      setCoverFile(null);
    },
    onError: (err: unknown) => {
      let msg = 'Không thể tạo kênh. Vui lòng kiểm tra lại thông tin.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
    },
  });

  // 8.2. Update Channel Metadata Mutation
  const updateChannelMutation = useMutation({
    mutationFn: (data: ChannelUpdateFormData) => {
      if (!channel) throw new Error('Không tìm thấy kênh');
      return channelsApi.updateChannel(channel.id, {
        name: data.name,
        description: data.description,
      });
    },
    onSuccess: () => {
      setSuccessToast('Cập nhật thông tin kênh thành công!');
      queryClient.invalidateQueries({ queryKey: ['creator', 'my-channel'] });
    },
    onError: (err: unknown) => {
      let msg = 'Cập nhật kênh thất bại.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
    },
  });

  // 8.3. Upload Avatar Mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => channelsApi.uploadAvatar(file),
    onSuccess: () => {
      setSuccessToast('Cập nhật ảnh đại diện kênh thành công!');
      queryClient.invalidateQueries({ queryKey: ['creator', 'my-channel'] });
    },
    onError: (err: unknown) => {
      let msg = 'Tải ảnh đại diện thất bại.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
    },
  });

  // 8.4. Upload Cover Mutation
  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => channelsApi.uploadCover(file),
    onSuccess: () => {
      setSuccessToast('Cập nhật ảnh bìa kênh thành công!');
      queryClient.invalidateQueries({ queryKey: ['creator', 'my-channel'] });
    },
    onError: (err: unknown) => {
      let msg = 'Tải ảnh bìa thất bại.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
    },
  });

  // 8.5. Upsert Membership Plan Mutation
  const upsertPlanMutation = useMutation({
    mutationFn: (payload: MembershipPlanRequest) => {
      if (!channel) throw new Error('Chưa có kênh podcast');
      return membershipApi.upsertChannelPlan(channel.id, payload);
    },
    onSuccess: (res) => {
      setSuccessToast('Lưu cấu hình gói hội viên VIP thành công!');
      if (res?.data) {
        queryClient.setQueryData(['creator-channel-plan', channel?.id], res);
      }
      queryClient.invalidateQueries({ queryKey: ['creator-channel-plan', channel?.id] });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể lưu gói hội viên. Vui lòng kiểm tra lại.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
    },
  });

  // File selection handlers for existing channel
  const handleDirectAvatarUpload = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setErrorMessage(err);
      return;
    }
    uploadAvatarMutation.mutate(file);
  };

  const handleDirectCoverUpload = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setErrorMessage(err);
      return;
    }
    uploadCoverMutation.mutate(file);
  };

  // Synchronized navigation actions between tabs
  const handleNavigateToEdit = () => {
    setActiveTab('info');
    setTimeout(() => {
      metadataFormRef.current?.focusNameInput();
    }, 150);
  };

  const handleNavigateToPlan = () => {
    setActiveTab('membership');
  };

  // ─── 9. Render Guards ──────────────────────────────────────────────────────
  // 9.1. Loading Skeleton
  if (isCheckingKyc || (isKycApproved && isLoadingChannel)) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        {/* Banner Skeleton */}
        <div className="h-28 bg-[#FAF8F5] rounded-2xl border border-[#EBE4D8]" />
        {/* Tab Bar Skeleton */}
        <div className="flex gap-4 border-b border-[#EBE4D8] pb-2">
          <div className="h-9 w-28 bg-[#FAF8F5] rounded-lg" />
          <div className="h-9 w-32 bg-[#FAF8F5] rounded-lg" />
          <div className="h-9 w-32 bg-[#FAF8F5] rounded-lg" />
          <div className="h-9 w-28 bg-[#FAF8F5] rounded-lg" />
        </div>
        {/* Content Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-56 bg-white rounded-2xl border border-[#EBE4D8]" />
            <div className="h-72 bg-white rounded-2xl border border-[#EBE4D8]" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-80 bg-white rounded-2xl border border-[#EBE4D8]" />
            <div className="h-44 bg-[#FFFBF7] rounded-2xl border border-[#F5E8DC]" />
          </div>
        </div>
      </div>
    );
  }

  // 9.2. KYC Error State
  if (isKycError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <ChannelHeaderBanner status="LỖI HỒ SƠ" />
        <KycGateCard
          status="ERROR"
          errorMessage={kycErrorMessage}
          onRetry={refetchKyc}
        />
      </div>
    );
  }

  // 9.3. KYC Gating Barrier (If not APPROVED)
  if (!isKycApproved) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <ChannelHeaderBanner status={kycStatus} />
        <KycGateCard
          status={kycStatus}
          rejectionReason={rejectionReason}
          onRetry={refetchKyc}
        />
      </div>
    );
  }

  // 9.4. Channel API Error State (When approved but endpoint fails with non-404)
  if (isChannelError) {
    const errorMsg =
      axios.isAxiosError(channelError)
        ? channelError.response?.data?.message || 'Không thể tải thông tin kênh'
        : 'Đã xảy ra lỗi khi kết nối máy chủ';

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <ChannelHeaderBanner status="LỖI KẾT NỐI" />
        <div className="rounded-2xl border border-[#FCA5A5] bg-white p-6 shadow-2xs flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <h3 className="font-serif text-lg font-bold text-[#1F1A19]">
              Lỗi tải dữ liệu kênh
            </h3>
            <p className="text-xs text-[#786D66]">{errorMsg}</p>
            <button
              type="button"
              onClick={() => refetchChannel()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] cursor-pointer mt-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 10. Empty Channel State: Onboarding Create View ────────────────────────
  if (!channel) {
    return (
      <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto">
        <ChannelHeaderBanner status="CHƯA KHỞI TẠO" />
        <ChannelCreateView
          onSubmit={(data) => createChannelMutation.mutate(data)}
          isSubmitting={createChannelMutation.isPending}
          avatarFile={avatarFile}
          avatarPreview={avatarPreview}
          coverFile={coverFile}
          coverPreview={coverPreview}
          onFileSelect={handleOnboardingFileSelect}
          error={errorMessage}
        />
      </div>
    );
  }

  // ─── 11. Tab Configuration (Synchronized Tabs) ─────────────────────────────
  const isPlanActive = currentPlan?.status === 'ACTIVE';

  const CHANNEL_TABS: TabItem[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: <LayoutDashboard className="h-4 w-4" />,
      badge: `${totalEpisodes} tập`,
    },
    {
      id: 'info',
      label: 'Thông tin kênh',
      icon: <Sliders className="h-4 w-4" />,
    },
    {
      id: 'membership',
      label: 'Gói hội viên VIP',
      icon: <Crown className="h-4 w-4" />,
      badge: isPlanActive ? 'VIP' : undefined,
    },
    {
      id: 'support',
      label: 'Mẹo & Hỗ trợ',
      icon: <Headphones className="h-4 w-4" />,
    },
  ];

  // ─── 12. Full Dashboard Management View with GSAP Synchronized Tabs ────────
  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center justify-between gap-3 rounded-xl border border-[#A6E9B9] bg-[#EDFDF2] px-4 py-3 text-xs font-semibold text-[#168A4E] shadow-lg animate-in slide-in-from-top-4 duration-200 select-none max-w-md"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:text-[#0E5832] transition-colors cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl p-4 bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-xs flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[#DC2626] hover:underline text-[11px] font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Page Hero Header Banner with Historical Artwork */}
      <ChannelHeaderBanner status={channel.status} />

      {/* Synchronized Tab Navigation with Sliding GSAP Indicator */}
      <div data-motion-target="tabs" className="bg-white rounded-2xl border border-[#EBE4D8] px-4 pt-1 shadow-2xs">
        <AnimatedTabs
          tabs={CHANNEL_TABS}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as ChannelTabKey)}
        />
      </div>

      {/* Dynamic Animated Tab Panels */}
      <div ref={tabContentRef} className="space-y-6">
        {/* ─── TAB 1: TỔNG QUAN (OVERVIEW) ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div data-tab-content className="space-y-6">
            {/* KPI Metrics Strip (Honest Real Data, No Icons in Circles, Flat Surface) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl border border-[#EBE4D8] bg-white p-4 space-y-1">
                <span className="text-[11px] font-semibold text-[#786D66] block">
                  Trạng thái phát sóng
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-serif text-base sm:text-lg font-bold text-[#1F1A19]">
                    {channel.status === 'ACTIVE' ? 'Đang hoạt động' : channel.status}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono block">
                  Mã kênh: #{channel.id}
                </span>
              </div>

              <div className="rounded-xl border border-[#EBE4D8] bg-white p-4 space-y-1">
                <span className="text-[11px] font-semibold text-[#786D66] block">
                  Tập podcast đã tạo
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#1F1A19] block">
                  {totalEpisodes}
                </span>
                <span className="text-[10px] text-stone-400 block">
                  Toàn bộ nội dung trong Studio
                </span>
              </div>

              <div className="rounded-xl border border-[#EBE4D8] bg-white p-4 space-y-1">
                <span className="text-[11px] font-semibold text-[#786D66] block">
                  Tập hoàn tất / Xuất bản
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 block">
                  {completedEpisodes}
                </span>
                <span className="text-[10px] text-stone-400 block">
                  Sẵn sàng phát sóng tới thính giả
                </span>
              </div>

              <div className="rounded-xl border border-[#EBE4D8] bg-white p-4 space-y-1">
                <span className="text-[11px] font-semibold text-[#786D66] block">
                  Gói Hội viên VIP
                </span>
                <div className="flex items-baseline gap-1 pt-0.5">
                  <span className="font-serif text-base sm:text-lg font-bold text-[#A31D24] font-mono tabular-nums">
                    {currentPlan ? formatVND(currentPlan.monthlyPrice) : 'Chưa thiết lập'}
                  </span>
                  {currentPlan && (
                    <span className="text-[10px] text-[#786D66]">/tháng</span>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 block truncate">
                  {isPlanActive ? 'Đang nhận đăng ký' : 'Tạm dừng / Chưa cấu hình'}
                </span>
              </div>
            </div>

            {/* Main Showcase & Live Platform Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols): Showcase & Fast Navigation Hub */}
              <div className="lg:col-span-8 space-y-6">
                <ChannelShowcaseCard
                  channel={channel}
                  onSelectAvatar={handleDirectAvatarUpload}
                  onSelectCover={handleDirectCoverUpload}
                  isUploadingAvatar={uploadAvatarMutation.isPending}
                  isUploadingCover={uploadCoverMutation.isPending}
                  onEditClick={handleNavigateToEdit}
                />

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shortcut 1: Edit info */}
                  <div
                    onClick={handleNavigateToEdit}
                    className="group rounded-2xl border border-[#EBE4D8] bg-white p-5 hover:border-[#D6CEBF] hover:bg-[#FAF8F5]/50 transition-all cursor-pointer shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#A31D24] border border-[#EBE4D8]">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#786D66] group-hover:translate-x-1 group-hover:text-[#A31D24] transition-all" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#1F1A19]">
                        Chỉnh sửa Hồ sơ & Nhận diện
                      </h4>
                      <p className="text-xs text-[#786D66] mt-0.5 leading-relaxed">
                        Cập nhật tên kênh, lời giới thiệu và hình ảnh đại diện thương hiệu.
                      </p>
                    </div>
                  </div>

                  {/* Shortcut 2: Membership plan */}
                  <div
                    onClick={handleNavigateToPlan}
                    className="group rounded-2xl border border-[#EBE4D8] bg-white p-5 hover:border-[#D6CEBF] hover:bg-[#FAF8F5]/50 transition-all cursor-pointer shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDF2F2] text-[#A31D24] border border-[#F9D2D4]">
                        <Crown className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#786D66] group-hover:translate-x-1 group-hover:text-[#A31D24] transition-all" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#1F1A19]">
                        Cấu hình Gói Hội viên VIP
                      </h4>
                      <p className="text-xs text-[#786D66] mt-0.5 leading-relaxed">
                        Thiết lập biểu phí thuê bao và nhận 90% doanh thu tự động về ví.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): Live Platform Channel Preview */}
              <div className="lg:col-span-4 space-y-6">
                <ChannelPreviewSidebarCard
                  channel={channel}
                  totalEpisodes={totalEpisodes}
                  completedEpisodes={completedEpisodes}
                  onPreviewClick={() => setIsPreviewModalOpen(true)}
                  onListenClick={() => setIsPreviewModalOpen(true)}
                />

                {/* Quick Support Assistance Card */}
                <div className="rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#1F1A19]">
                    <Sparkles className="h-4 w-4 text-[#A31D24]" />
                    <span>Cần hỗ trợ chuyên sâu?</span>
                  </div>
                  <p className="text-[#5C524C] leading-relaxed">
                    Đội ngũ Sử Ký luôn túc trực hỗ trợ bạn thiết lập kênh và xử lý bản quyền.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 font-bold text-[#A31D24] hover:underline cursor-pointer pt-1"
                  >
                    <span>Mở cửa sổ trợ giúp</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: THÔNG TIN KÊNH (INFO & METADATA) ─────────────────────── */}
        {activeTab === 'info' && (
          <div data-tab-content className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <ChannelMetadataFormCard
                ref={metadataFormRef}
                channel={channel}
                onSubmit={(data) => updateChannelMutation.mutate(data)}
                isSubmitting={updateChannelMutation.isPending}
              />
            </div>

            {/* Sidebar Column (4 cols): Guidelines */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-serif text-sm font-bold text-[#1F1A19] flex items-center gap-2 border-b border-[#F0EBE1] pb-2.5">
                  <FileCheck2 className="h-4 w-4 text-[#A31D24]" />
                  <span>Tiêu chuẩn nội dung kênh</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-[#5C524C]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#A31D24] font-bold">•</span>
                    <span>Tên kênh ngắn gọn, dễ nhớ, phản ánh rõ chủ đề lịch sử hoặc nhân vật nghiên cứu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#A31D24] font-bold">•</span>
                    <span>Mô tả cung cấp thông tin xuất xứ nguồn tư liệu, văn phong và đối tượng phục vụ.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#A31D24] font-bold">•</span>
                    <span>Hình ảnh nhận diện không vi phạm thuần phong mỹ tục hoặc bản quyền sở hữu trí tuệ.</span>
                  </li>
                </ul>
              </div>

              <ChannelTipsCard />
            </div>
          </div>
        )}

        {/* ─── TAB 3: GÓI HỘI VIÊN VIP (MEMBERSHIP) ────────────────────────── */}
        {activeTab === 'membership' && (
          <div data-tab-content className="space-y-6">
            <ChannelMembershipPlanCard
              currentPlan={currentPlan}
              onSubmit={(payload) => upsertPlanMutation.mutate(payload)}
              isSubmitting={upsertPlanMutation.isPending}
            />

            {/* Transparent Revenue Policy Breakdown */}
            <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#A31D24] border border-[#EBE4D8]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#1F1A19]">
                  Chính sách phân chia doanh thu & Bảo chứng quyền lợi
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                  <span className="font-bold text-[#1F1A19] block">90% Doanh thu về Ví Creator</span>
                  <p className="text-[#786D66] leading-relaxed">
                    Hệ thống tự động ghi nhận số dư khả dụng ngay khi thính giả đăng ký hoặc gia hạn gói hội viên.
                  </p>
                </div>

                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                  <span className="font-bold text-[#1F1A19] block">10% Phí vận hành nền tảng</span>
                  <p className="text-[#786D66] leading-relaxed">
                    Dùng để chi trả hạ tầng máy chủ streaming, băng thông Cloudflare và duy trì cổng thanh toán.
                  </p>
                </div>

                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5]/60 p-4 space-y-1.5">
                  <span className="font-bold text-[#1F1A19] block">Bảo mật & Quyền lợi VIP</span>
                  <p className="text-[#786D66] leading-relaxed">
                    Các tập podcast độc quyền hội viên được bảo vệ tự động bằng cơ chế phân quyền bảo mật cấp API.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: MẸO & HỖ TRỢ (TIPS & SUPPORT) ────────────────────────── */}
        {activeTab === 'support' && (
          <div data-tab-content className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <ChannelTipsCard />
            <div className="space-y-6">
              <ChannelHelpCard onContactClick={() => setIsSupportModalOpen(true)} />

              {/* Quick Platform Preview Launch Tile */}
              <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#A31D24]" />
                  <h4 className="font-serif text-sm font-bold text-[#1F1A19]">
                    Xem trước kênh tương tác
                  </h4>
                </div>
                <p className="text-xs text-[#5C524C] leading-relaxed">
                  Trải nghiệm góc nhìn của thính giả khi ghé thăm kênh podcast của bạn, bao gồm phát thử âm thanh trực tiếp.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] hover:bg-[#F3EFE6] px-4 py-2 text-xs font-semibold text-[#1F1A19] transition-all cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#A31D24]" />
                  <span>Mở trình xem trước thính giả</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Support Modal */}
      <ChannelSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Interactive Platform Preview Modal */}
      <ChannelPlatformPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        channel={channel}
        plan={currentPlan}
        videos={creatorVideos}
        onPlayEpisode={(vid) => {
          setSuccessToast(`Đang phát: ${vid.title}`);
        }}
      />
    </div>
  );
};
