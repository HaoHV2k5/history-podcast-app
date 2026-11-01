import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
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

export const CreatorChannelPage: React.FC = () => {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const metadataFormRef = useRef<ChannelMetadataFormCardRef>(null);

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

  // ─── 6. GSAP 60fps Entrance Motion ─────────────────────────────────────────
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

  // ─── 9. Render Guards ──────────────────────────────────────────────────────
  // 9.1. Loading Skeleton
  if (isCheckingKyc || (isKycApproved && isLoadingChannel)) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-28 bg-[#FAF8F5] rounded-2xl border border-[#EBE4D8]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-44 bg-white rounded-2xl border border-[#EBE4D8]" />
            <div className="h-64 bg-white rounded-2xl border border-[#EBE4D8]" />
            <div className="h-80 bg-white rounded-2xl border border-[#EBE4D8]" />
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

  // ─── 11. Channel Exists: Full Dashboard Management View ─────────────────────
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

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8 cols (approx 68% width) */}
        <main className="lg:col-span-8 space-y-6">
          {/* Card 1: Channel Identity Showcase Card */}
          <ChannelShowcaseCard
            channel={channel}
            onSelectAvatar={handleDirectAvatarUpload}
            onSelectCover={handleDirectCoverUpload}
            isUploadingAvatar={uploadAvatarMutation.isPending}
            isUploadingCover={uploadCoverMutation.isPending}
            onEditClick={() => metadataFormRef.current?.focusNameInput()}
          />

          {/* Card 2: Edit Channel Information */}
          <ChannelMetadataFormCard
            ref={metadataFormRef}
            channel={channel}
            onSubmit={(data) => updateChannelMutation.mutate(data)}
            isSubmitting={updateChannelMutation.isPending}
          />

          {/* Card 3: Configure VIP Membership Plan */}
          <ChannelMembershipPlanCard
            currentPlan={currentPlan}
            onSubmit={(payload) => upsertPlanMutation.mutate(payload)}
            isSubmitting={upsertPlanMutation.isPending}
          />
        </main>

        {/* Right Sidebar Column: 4 cols (approx 32% width) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Widget 1: Live Platform Channel Preview */}
          <ChannelPreviewSidebarCard
            channel={channel}
            totalEpisodes={totalEpisodes}
            completedEpisodes={completedEpisodes}
            onPreviewClick={() => setIsPreviewModalOpen(true)}
            onListenClick={() => setIsPreviewModalOpen(true)}
          />

          {/* Widget 2: Channel Optimization Tips */}
          <ChannelTipsCard />

          {/* Widget 3: Need Support Card */}
          <ChannelHelpCard onContactClick={() => setIsSupportModalOpen(true)} />
        </aside>
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
          // Play episode interaction feedback
          setSuccessToast(`Đang phát: ${vid.title}`);
        }}
      />
    </div>
  );
};
