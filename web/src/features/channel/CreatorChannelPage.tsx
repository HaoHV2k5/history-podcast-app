import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Radio,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  PlusCircle,
  Calendar,
  Upload,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useKycGate } from '@/features/kyc/useKycGate';
import { KycGateCard } from '@/features/kyc/KycGateCard';
import { channelsApi } from '@/services/api/channels';
import { ChannelItem } from '@/types/channel';
import { formatDate } from '@/utils/formatters';

const channelCreateSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên kênh phải có ít nhất 3 ký tự')
    .max(100, 'Tên kênh không được vượt quá 100 ký tự'),
  description: z
    .string()
    .min(10, 'Mô tả kênh phải có ít nhất 10 ký tự')
    .max(1000, 'Mô tả kênh không được vượt quá 1000 ký tự'),
});

const channelUpdateSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên kênh phải có ít nhất 3 ký tự')
    .max(100, 'Tên kênh không được vượt quá 100 ký tự'),
  description: z
    .string()
    .min(10, 'Mô tả kênh phải có ít nhất 10 ký tự')
    .max(1000, 'Mô tả kênh không được vượt quá 1000 ký tự'),
});

type ChannelCreateFormData = z.infer<typeof channelCreateSchema>;
type ChannelUpdateFormData = z.infer<typeof channelUpdateSchema>;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CreatorChannelPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Check KYC Gate
  const {
    status: kycStatus,
    isApproved: isKycApproved,
    rejectionReason,
    isLoading: isCheckingKyc,
    isError: isKycError,
    errorMessage: kycErrorMessage,
    refetch: refetchKyc,
  } = useKycGate();

  // 2. Query My Channel
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

  // Local state for media uploads
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const createForm = useForm<ChannelCreateFormData>({
    resolver: zodResolver(channelCreateSchema),
    defaultValues: { name: '', description: '' },
  });

  const updateForm = useForm<ChannelUpdateFormData>({
    resolver: zodResolver(channelUpdateSchema),
    defaultValues: { name: '', description: '' },
  });

  // Pre-fill update form when channel data loads
  useEffect(() => {
    if (channel) {
      updateForm.setValue('name', channel.name);
      updateForm.setValue('description', channel.description || '');
    }
  }, [channel, updateForm]);

  // Handle toast timeout
  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(t);
  }, [successToast]);

  // Media validation helper
  const handleFileSelect = (
    file: File | undefined,
    type: 'avatar' | 'cover'
  ) => {
    setMediaError(null);
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMediaError('Định dạng ảnh không được hỗ trợ. Vui lòng chọn file JPG, PNG hoặc WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMediaError('Kích thước ảnh vượt quá 10MB. Vui lòng chọn file nhẹ hơn.');
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

  // Mutations
  const createChannelMutation = useMutation({
    mutationFn: async (data: ChannelCreateFormData) => {
      // 1. Create channel entity
      const res = await channelsApi.createChannel({
        name: data.name,
        description: data.description,
      });

      let avatarFailed = false;
      let coverFailed = false;

      // 2. Upload avatar if selected
      if (avatarFile) {
        try {
          await channelsApi.uploadAvatar(avatarFile);
        } catch (e) {
          console.warn('Avatar upload failed during creation:', e);
          avatarFailed = true;
        }
      }

      // 3. Upload cover if selected
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
          'Khởi tạo kênh thành công! Tuy nhiên việc tải ảnh gặp sự cố (dịch vụ lưu trữ media chưa khả dụng). Bạn có thể tải lại ảnh đại diện/ảnh bìa bất kỳ lúc nào trong trang này.'
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
      setMediaError(msg);
    },
  });

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
      setMediaError(msg);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => channelsApi.uploadAvatar(file),
    onSuccess: () => {
      setSuccessToast('Cập nhật ảnh đại diện kênh thành công!');
      queryClient.invalidateQueries({ queryKey: ['creator', 'my-channel'] });
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (err: unknown) => {
      let msg = 'Tải ảnh đại diện thất bại.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setMediaError(msg);
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => channelsApi.uploadCover(file),
    onSuccess: () => {
      setSuccessToast('Cập nhật ảnh bìa kênh thành công!');
      queryClient.invalidateQueries({ queryKey: ['creator', 'my-channel'] });
      setCoverFile(null);
      setCoverPreview(null);
    },
    onError: (err: unknown) => {
      let msg = 'Tải ảnh bìa thất bại.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setMediaError(msg);
    },
  });

  // 1. Loading State
  if (isCheckingKyc || (isKycApproved && isLoadingChannel)) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl">
        <div className="h-20 bg-surface rounded-xl border border-border" />
        <div className="h-96 bg-surface rounded-xl border border-border" />
      </div>
    );
  }

  // 2. KYC Error State
  if (isKycError) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Quản Lý Kênh Podcast
          </h1>
        </div>
        <KycGateCard
          status="ERROR"
          errorMessage={kycErrorMessage}
          onRetry={refetchKyc}
        />
      </div>
    );
  }

  // 3. KYC Gating Barrier (If not APPROVED)
  if (!isKycApproved) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            <Radio className="h-4 w-4" />
            <span>Kênh Podcast Sử Ký</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Thiết Lập & Quản Lý Kênh
          </h1>
          <p className="mt-2 text-sm text-muted">
            Quản lý thương hiệu nhà sáng tạo, thông tin mô tả và nhận diện hình ảnh của kênh podcast lịch sử.
          </p>
        </div>

        {/* Gating Gate Card */}
        <KycGateCard
          status={kycStatus}
          rejectionReason={rejectionReason}
          onRetry={refetchKyc}
        />
      </div>
    );
  }

  // 4. Channel Error State (when approved but channel endpoint fails with non-404 error)
  if (isChannelError) {
    const errorMsg =
      axios.isAxiosError(channelError)
        ? channelError.response?.data?.message || 'Không thể tải thông tin kênh'
        : 'Đã xảy ra lỗi khi kết nối máy chủ';

    return (
      <div className="max-w-4xl space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Quản Lý Kênh Podcast
          </h1>
        </div>
        <div className="rounded-xl border border-status-error-text/30 bg-surface p-6 shadow-xs flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-status-error-text shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <h3 className="font-serif text-lg font-bold text-ink">
              Lỗi tải dữ liệu kênh
            </h3>
            <p className="text-sm text-muted">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchChannel()}
              className="gap-2 mt-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Thử lại</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. NO CHANNEL YET: RENDER CREATE CHANNEL FORM
  if (!channel) {
    return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            <Radio className="h-4 w-4" />
            <span>Khởi Tạo Thương Hiệu Tác Giả</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Khởi Tạo Kênh Podcast Mới
          </h1>
          <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
            Hồ sơ KYC của bạn đã được phê duyệt. Hãy thiết lập kênh podcast đầu tiên của bạn trên Sử Ký để bắt đầu phát hành các tác phẩm lịch sử.
          </p>
        </div>

        {/* KYC Approved Confirmation Badge */}
        <div className="rounded-lg border border-status-success-text/30 bg-status-success-bg/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-status-success-text shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-status-success-text block">
                Đủ điều kiện tạo kênh (KYC Verified)
              </span>
              <span className="text-status-success-text/80">
                Mỗi nhà sáng tạo được tạo 1 kênh podcast chính thức gắn liền với tài khoản tác giả.
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {mediaError && (
          <div className="rounded-lg p-4 bg-status-error-bg text-status-error-text border border-status-error-text/30 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{mediaError}</span>
          </div>
        )}

        {/* Create Channel Form */}
        <form
          onSubmit={createForm.handleSubmit((data) => createChannelMutation.mutate(data))}
          className="space-y-8"
        >
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-6">
            <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
              <Radio className="h-4 w-4 text-accent" />
              <span>Thông tin nhận diện Kênh</span>
            </h3>

            {/* Channel Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink block">
                Tên Kênh Podcast <span className="text-accent">*</span>
              </label>
              <Input
                {...createForm.register('name')}
                placeholder="Ví dụ: Đại Việt Hào Khí, Sử Ký Trầm Luân..."
                error={Boolean(createForm.formState.errors.name)}
                leftIcon={<Radio className="h-4 w-4" />}
              />
              <p className="text-[11px] text-muted">
                Từ 3 đến 100 ký tự. Tên kênh phải là duy nhất trên toàn hệ thống Sử Ký.
              </p>
              {createForm.formState.errors.name && (
                <p className="text-[11px] text-status-error-text">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink block">
                Mô tả tôn chỉ & định hướng của kênh <span className="text-accent">*</span>
              </label>
              <Textarea
                {...createForm.register('description')}
                placeholder="Giới thiệu về mục tiêu, các chủ đề lịch sử chính mà kênh sẽ khai thác (triều đại, danh tướng, các trận đánh lịch sử)..."
                rows={4}
                error={Boolean(createForm.formState.errors.description)}
              />
              <p className="text-[11px] text-muted">Tối đa 1000 ký tự.</p>
              {createForm.formState.errors.description && (
                <p className="text-[11px] text-status-error-text">
                  {createForm.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Visual Media Selection (Optional on creation, can be uploaded immediately) */}
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Hình ảnh nhận diện kênh (Tùy chọn)
                </h4>
                <p className="text-xs text-muted mt-1">
                  Bạn có thể chọn ảnh đại diện và ảnh bìa ngay bây giờ hoặc tải lên sau khi tạo kênh. Hỗ trợ JPG, PNG, WEBP (tối đa 10MB).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Avatar Picker */}
                <div className="space-y-3">
                  <span className="text-xs font-medium text-ink block">
                    Ảnh đại diện Kênh (Avatar)
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Radio className="h-8 w-8 text-muted" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(e.target.files?.[0], 'avatar')
                        }
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        <span>{avatarFile ? 'Đổi ảnh đại diện' : 'Chọn ảnh đại diện'}</span>
                      </Button>
                      <p className="text-[11px] text-muted">Khuyến nghị tỉ lệ 1:1</p>
                    </div>
                  </div>
                </div>

                {/* Cover Picker */}
                <div className="space-y-3">
                  <span className="text-xs font-medium text-ink block">
                    Ảnh bìa Kênh (Cover Banner)
                  </span>
                  <div className="space-y-2">
                    <div className="relative h-20 w-full overflow-hidden rounded-xl border border-border bg-surface-subtle flex items-center justify-center">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-muted text-xs">
                          <ImageIcon className="h-5 w-5" />
                          <span>Chưa chọn ảnh bìa</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(e.target.files?.[0], 'cover')
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{coverFile ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}</span>
                    </Button>
                    <p className="text-[11px] text-muted">Khuyến nghị tỉ lệ 16:9</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={createChannelMutation.isPending}
                isLoading={createChannelMutation.isPending}
                className="gap-2 shadow-sm min-w-[180px]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Hoàn tất & Tạo Kênh</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // 6. CHANNEL EXISTS: RENDER CHANNEL MANAGEMENT VIEW
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Toast Feedback */}
      {successToast && (
        <div className="rounded-lg p-4 bg-status-success-bg text-status-success-text border border-status-success-text/30 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-status-success-text hover:underline text-[11px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {mediaError && (
        <div className="rounded-lg p-4 bg-status-error-bg text-status-error-text border border-status-error-text/30 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="leading-relaxed flex-1">{mediaError}</span>
          <button
            onClick={() => setMediaError(null)}
            className="text-status-error-text hover:underline text-[11px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            <Radio className="h-4 w-4" />
            <span>Kênh Podcast Chính Thức</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Quản Lý Kênh Podcast
          </h1>
          <p className="mt-1 text-sm text-muted">
            Thiết lập nhận diện, chỉnh sửa thông tin mô tả và cập nhật hình ảnh của kênh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-3 py-1 text-xs font-bold text-status-success-text border border-status-success-text/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            KÊNH HOẠT ĐỘNG ({channel.status})
          </span>
        </div>
      </div>

      {/* Channel Showcase Card */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-surface-subtle border-b border-border overflow-hidden">
          {channel.coverUrl ? (
            <img
              src={channel.coverUrl}
              alt={channel.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-accent/25 via-surface-subtle to-accent/15 flex items-center justify-center">
              <span className="font-serif text-sm tracking-wider uppercase text-muted font-bold opacity-60">
                Sử Ký Podcast Platform • Banner 16:9
              </span>
            </div>
          )}

          {/* Cover upload button overlay */}
          <div className="absolute top-4 right-4">
            <input
              type="file"
              ref={coverInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  handleFileSelect(f, 'cover');
                  uploadCoverMutation.mutate(f);
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadCoverMutation.isPending}
              isLoading={uploadCoverMutation.isPending}
              className="gap-2 bg-surface/90 backdrop-blur-xs border border-border shadow-xs"
            >
              <Upload className="h-4 w-4" />
              <span>Đổi ảnh bìa</span>
            </Button>
          </div>
        </div>

        {/* Avatar & Channel Header Details */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 sm:-mt-14 mb-4">
            {/* Avatar with upload button */}
            <div className="relative group shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-surface bg-surface-subtle overflow-hidden shadow-sm flex items-center justify-center">
                {channel.avatarUrl ? (
                  <img
                    src={channel.avatarUrl}
                    alt={channel.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Radio className="h-12 w-12 text-muted" />
                )}
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    handleFileSelect(f, 'avatar');
                    uploadAvatarMutation.mutate(f);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                aria-label="Cập nhật ảnh đại diện kênh"
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-medium transition-opacity cursor-pointer m-1"
              >
                <Camera className="h-5 w-5 mb-0.5" />
                <span>Đổi ảnh</span>
              </button>
            </div>

            <div className="flex-1 space-y-1">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
                {channel.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="font-mono">Mã kênh: #{channel.id}</span>
                <span>•</span>
                <span className="font-mono">Tác giả ID: #{channel.creatorId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày tạo: {formatDate(channel.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-ink/80 leading-relaxed max-w-3xl pt-2">
            {channel.description || 'Chưa có mô tả cho kênh này.'}
          </p>
        </div>
      </div>

      {/* Edit Channel Metadata Form */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent" />
            <span>Chỉnh sửa thông tin Kênh</span>
          </h3>
          <span className="text-xs text-muted">
            Cập nhật lần cuối: {formatDate(channel.updatedAt || channel.createdAt)}
          </span>
        </div>

        <form
          onSubmit={updateForm.handleSubmit((data) => updateChannelMutation.mutate(data))}
          className="space-y-5"
        >
          {/* Channel Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink block">
              Tên Kênh Podcast <span className="text-accent">*</span>
            </label>
            <Input
              {...updateForm.register('name')}
              placeholder="Tên kênh podcast..."
              error={Boolean(updateForm.formState.errors.name)}
              leftIcon={<Radio className="h-4 w-4" />}
            />
            {updateForm.formState.errors.name && (
              <p className="text-[11px] text-status-error-text">
                {updateForm.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink block">
              Mô tả Kênh <span className="text-accent">*</span>
            </label>
            <Textarea
              {...updateForm.register('description')}
              rows={4}
              placeholder="Mô tả tôn chỉ và chủ đề kênh..."
              error={Boolean(updateForm.formState.errors.description)}
            />
            {updateForm.formState.errors.description && (
              <p className="text-[11px] text-status-error-text">
                {updateForm.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="default"
              disabled={updateChannelMutation.isPending}
              isLoading={updateChannelMutation.isPending}
              className="gap-2 shadow-sm min-w-[140px]"
            >
              <Save className="h-4 w-4" />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
