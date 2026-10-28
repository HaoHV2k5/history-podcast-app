import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  PlusCircle,
  Layers,
  Edit3,
  Trash2,
  Film,
  Calendar,
  AlertCircle,
  X,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { seriesApi } from '@/services/api/series';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { SeriesItem, SeriesDetail, CreateSeriesRequest, UpdateSeriesRequest } from '@/types/series';
import {
  canMoveUp,
  canMoveDown,
  reorderItems,
  extractContentIds,
  validateReorderPayload,
} from './seriesLogic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';

export const CreatorSeriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Create / Edit modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'PUBLISHED' | 'HIDDEN' | 'DRAFT'>('PUBLISHED');
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadSeriesCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Định dạng ảnh không hợp lệ. Vui lòng chọn file JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Kích thước ảnh vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    setFormError(null);
    setIsUploadingCover(true);
    try {
      const res = await creatorStudioApi.uploadSceneImage(file, 'series/covers');
      const uploadedUrl = res.data?.imageUrl || '';
      if (uploadedUrl) {
        setFormCoverUrl(uploadedUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải ảnh bìa lên. Vui lòng thử lại.';
      setFormError(msg);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Delete modal state
  const [deleteConfirmSeries, setDeleteConfirmSeries] = useState<SeriesItem | null>(null);

  // Episode Management modal state
  const [managingSeriesId, setManagingSeriesId] = useState<number | null>(null);
  const [addVideoId, setAddVideoId] = useState<string>('');
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Creator's series list
  const {
    data: seriesRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['creator-series-list'],
    queryFn: () => seriesApi.getMySeries(),
  });
  const seriesList = Array.isArray(seriesRes?.data) ? seriesRes.data : [];

  // 2. Fetch series detail when managing episodes
  const {
    data: seriesDetailRes,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ['creator-series-detail', managingSeriesId],
    queryFn: () => seriesApi.getSeriesDetail(managingSeriesId!),
    enabled: managingSeriesId != null,
  });
  const seriesDetail: SeriesDetail | undefined = seriesDetailRes?.data;

  // 3. Fetch Creator's videos to pick from when adding to series
  const {
    data: creatorVideosRes,
  } = useQuery({
    queryKey: ['creator-videos-for-series'],
    queryFn: () => creatorStudioApi.getVideos(),
    enabled: managingSeriesId != null,
  });
  const creatorVideos = Array.isArray(creatorVideosRes?.data) ? creatorVideosRes.data : [];

  // Mutation: Create Series
  const createMutation = useMutation({
    mutationFn: (req: CreateSeriesRequest) => seriesApi.createSeries(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setModalMode(null);
      resetForm();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message || 'Không thể tạo tuyển tập. Vui lòng thử lại.');
    },
  });

  // Mutation: Update Series
  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateSeriesRequest }) =>
      seriesApi.updateSeries(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', selectedSeries?.id] });
      setModalMode(null);
      resetForm();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message || 'Không thể cập nhật tuyển tập. Vui lòng thử lại.');
    },
  });

  // Mutation: Delete Series
  const deleteMutation = useMutation({
    mutationFn: (id: number) => seriesApi.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setDeleteConfirmSeries(null);
    },
  });

  // Mutation: Add Episode to Series
  const addEpisodeMutation = useMutation({
    mutationFn: ({ seriesId, contentId }: { seriesId: number; contentId: number }) =>
      seriesApi.addSeriesItem(seriesId, { contentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setAddVideoId('');
    },
  });

  // Mutation: Remove Episode from Series
  const removeEpisodeMutation = useMutation({
    mutationFn: ({ seriesId, contentId }: { seriesId: number; contentId: number }) =>
      seriesApi.removeSeriesItem(seriesId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
    },
  });

  // Mutation: Reorder Episodes within Series
  const reorderMutation = useMutation({
    mutationFn: ({ seriesId, contentIds }: { seriesId: number; contentIds: number[] }) =>
      seriesApi.reorderSeriesItems(seriesId, { contentIds }),
    onSuccess: (res) => {
      if (res.data) {
        queryClient.setQueryData(['creator-series-detail', managingSeriesId], res);
      } else {
        queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
      }
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setReorderError(null);
      setReorderSuccessMsg('Đã cập nhật thứ tự các tập thành công.');
      setTimeout(() => setReorderSuccessMsg(null), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setReorderError(e.response?.data?.message || 'Không thể sắp xếp lại thứ tự tập. Vui lòng thử lại.');
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
    },
  });

  const handleMoveEpisode = (fromIdx: number, toIdx: number) => {
    if (!managingSeriesId || !seriesDetail?.items) return;
    if (reorderMutation.isPending) return; // Prevent duplicate requests
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= seriesDetail.items.length ||
      toIdx >= seriesDetail.items.length ||
      fromIdx === toIdx
    ) {
      return;
    }

    const reordered = reorderItems(seriesDetail.items, fromIdx, toIdx);
    const contentIds = extractContentIds(reordered);
    const validation = validateReorderPayload(contentIds);
    if (!validation.valid) {
      setReorderError(validation.error || 'Thứ tự tập không hợp lệ');
      return;
    }

    setReorderError(null);
    setReorderSuccessMsg(null);
    reorderMutation.mutate({ seriesId: managingSeriesId, contentIds });
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCoverUrl('');
    setFormStatus('PUBLISHED');
    setFormError(null);
    setSelectedSeries(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
  };

  const openEditModal = (s: SeriesItem) => {
    setSelectedSeries(s);
    setFormTitle(s.title || '');
    setFormDescription(s.description || '');
    setFormCoverUrl(s.coverUrl || '');
    setFormStatus((s.status as 'PUBLISHED' | 'HIDDEN' | 'DRAFT') || 'PUBLISHED');
    setFormError(null);
    setModalMode('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Tiêu đề tuyển tập không được để trống.');
      return;
    }

    if (modalMode === 'create') {
      createMutation.mutate({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        coverUrl: formCoverUrl.trim() || undefined,
        status: formStatus,
      });
    } else if (modalMode === 'edit' && selectedSeries) {
      updateMutation.mutate({
        id: selectedSeries.id,
        req: {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          coverUrl: formCoverUrl.trim() || undefined,
          status: formStatus,
        },
      });
    }
  };

  const handleAddEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const cId = parseInt(addVideoId, 10);
    if (!managingSeriesId || isNaN(cId) || cId <= 0) return;
    addEpisodeMutation.mutate({ seriesId: managingSeriesId, contentId: cId });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-ink">Tuyển tập Podcast & Video</h1>
            <Badge variant="outline" className="text-xs border-accent/30 text-accent font-semibold">
              {seriesList.length} tuyển tập
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted">
            Tổ chức các tập podcast theo từng chủ đề hoặc thời kỳ lịch sử để thính giả theo dõi liền mạch.
          </p>
        </div>

        <Button
          id="btn-create-series"
          onClick={openCreateModal}
          className="gap-2 bg-accent hover:bg-accent/90 text-white shadow-subtle shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Tạo Tuyển Tập Mới</span>
        </Button>
      </div>

      {/* Main List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-60 rounded-xl bg-surface-subtle animate-pulse border border-border"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <p className="text-sm font-medium text-ink">Không thể tải danh sách tuyển tập.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Thử tải lại
          </Button>
        </div>
      ) : seriesList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-ink">Chưa có tuyển tập nào</h3>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
              Hãy tạo tuyển tập đầu tiên để gom các tác phẩm podcast lịch sử thành một chuỗi liền mạch theo triều đại hoặc chủ đề.
            </p>
          </div>
          <Button onClick={openCreateModal} className="gap-2 bg-accent text-white">
            <PlusCircle className="h-4 w-4" />
            Tạo Tuyển Tập Ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seriesList.map((series) => (
            <article
              key={series.id}
              className="group flex flex-col rounded-xl border border-border bg-surface shadow-subtle hover:border-accent/40 hover:shadow-card transition-all overflow-hidden"
            >
              {/* Cover Preview */}
              <div className="relative aspect-video w-full bg-surface-subtle overflow-hidden flex items-center justify-center border-b border-border">
                {series.coverUrl ? (
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <BookOpen className="h-9 w-9 text-accent/60" />
                    <span className="mt-1 text-xs text-ink-muted font-medium">
                      Tuyển tập lịch sử
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold border backdrop-blur-sm ${
                      series.status === 'PUBLISHED'
                        ? 'bg-emerald-50/90 text-emerald-700 border-emerald-300'
                        : series.status === 'HIDDEN'
                        ? 'bg-amber-50/90 text-amber-700 border-amber-300'
                        : 'bg-surface/90 text-ink-muted border-border'
                    }`}
                  >
                    {series.status === 'PUBLISHED' ? 'Công khai' : series.status === 'HIDDEN' ? 'Đã ẩn' : 'Bản nháp'}
                  </Badge>
                </div>

                {/* Duration & Count */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  <Layers className="h-3 w-3" />
                  <span>{series.itemCount} tập</span>
                  <span>•</span>
                  <span>{formatDuration(series.totalDurationSeconds)}</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base font-bold text-ink line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                    {series.title}
                  </h3>
                  {series.description && (
                    <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {series.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-border/80">
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(series.createdAt)}
                    </span>
                    <span className="font-mono">ID: #{series.id}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManagingSeriesId(series.id)}
                      className="gap-1.5 text-xs flex-1 border-accent/30 text-accent hover:bg-accent/5"
                    >
                      <Film className="h-3.5 w-3.5" />
                      Quản lý tập ({series.itemCount})
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(series)}
                        className="h-8 w-8 p-0 text-ink-muted hover:text-ink"
                        title="Chỉnh sửa tuyển tập"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmSeries(series)}
                        className="h-8 w-8 p-0 text-ink-muted hover:text-danger"
                        title="Xóa tuyển tập"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Dialog: Create / Edit Series */}
      <Dialog open={modalMode !== null} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-ink">
              {modalMode === 'create' ? 'Tạo Tuyển Tập Mới' : 'Cập Nhật Tuyển Tập'}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Điền thông tin chủ đề, mô tả và ảnh bìa để tuyển tập xuất hiện đồng bộ trên trang kênh.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Tiêu đề tuyển tập <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="Ví dụ: Hào Khí Đông A — Ba Lần Đại Phá Nguyên Mông"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Mô tả tuyển tập</label>
              <Textarea
                rows={3}
                placeholder="Tóm tắt bối cảnh lịch sử, triều đại hoặc các nhân vật tiêu biểu trong chuỗi podcast này..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-accent" />
                  <span>Ảnh bìa tuyển tập (16:9)</span>
                </label>
                <span className="text-[11px] font-sans text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-md border border-border/70">
                  Khuyên dùng tỉ lệ ngang 16:9
                </span>
              </div>

              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUploadSeriesCover}
                className="hidden"
              />

              {formCoverUrl ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-surface-subtle group shadow-2xs">
                  <img
                    src={formCoverUrl}
                    alt="Xem trước ảnh bìa tuyển tập"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-ink/45 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="h-8 text-xs gap-1.5 bg-white text-ink border-border active:scale-[0.97] transition-[transform,background-color] duration-150 ease-out"
                    >
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Đổi ảnh khác</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploadingCover}
                      onClick={() => setFormCoverUrl('')}
                      className="h-8 text-xs gap-1 bg-white text-danger border-danger/30 hover:bg-danger/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-out"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Gỡ</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploadingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-border hover:border-accent/50 bg-surface-subtle/50 hover:bg-accent/5 p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] transition-[transform,border-color,background-color] duration-150 ease-out disabled:opacity-60"
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="h-5 w-5 text-accent animate-spin" />
                      <span className="text-xs font-semibold text-accent">
                        Đang tải ảnh bìa lên...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-accent" />
                      <span className="text-xs font-semibold text-ink">
                        Bấm để chọn ảnh bìa từ máy tính
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Hỗ trợ ảnh JPG, PNG, WebP (tối đa 10MB) • Khuyến nghị 1280×720px
                      </span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Hoặc dán đường dẫn ảnh có sẵn (https://...)"
                  value={formCoverUrl}
                  onChange={(e) => setFormCoverUrl(e.target.value)}
                  className="text-xs h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="shrink-0 h-8 px-3 text-xs gap-1.5 border-accent/30 text-accent hover:bg-accent/5 active:scale-[0.97] transition-[transform,background-color,border-color] duration-150 ease-out"
                >
                  {isUploadingCover ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>Tải ảnh lên</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Trạng thái phát hành</label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={formStatus === 'PUBLISHED' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFormStatus('PUBLISHED')}
                  className={formStatus === 'PUBLISHED' ? 'bg-accent text-white' : ''}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Công khai
                </Button>
                <Button
                  type="button"
                  variant={formStatus === 'HIDDEN' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFormStatus('HIDDEN')}
                  className={formStatus === 'HIDDEN' ? 'bg-amber-600 text-white' : ''}
                >
                  <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                  Tạm ẩn
                </Button>
                <Button
                  type="button"
                  variant={formStatus === 'DRAFT' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFormStatus('DRAFT')}
                >
                  Bản nháp
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalMode(null)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="bg-accent text-white hover:bg-accent/90"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {modalMode === 'create' ? 'Tạo tuyển tập' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Confirmation */}
      <Dialog
        open={deleteConfirmSeries !== null}
        onOpenChange={(open) => !open && setDeleteConfirmSeries(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-danger flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Xác nhận xóa tuyển tập
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Bạn có chắc chắn muốn xóa tuyển tập <strong>{deleteConfirmSeries?.title}</strong>? Các video/podcast gốc vẫn sẽ được giữ nguyên vẹn trong thư viện nội dung.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmSeries(null)}
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmSeries && deleteMutation.mutate(deleteConfirmSeries.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Manage Episodes within Series */}
      <Dialog
        open={managingSeriesId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setManagingSeriesId(null);
            setReorderError(null);
            setReorderSuccessMsg(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <Film className="h-5 w-5 text-accent" />
              <span>Danh sách tập: {seriesDetail?.title || 'Đang tải...'}</span>
              {reorderMutation.isPending && (
                <span className="flex items-center gap-1 text-[11px] font-normal text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang lưu thứ tự...
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Thêm các tác phẩm podcast đã xuất bản vào tuyển tập này và sử dụng nút mũi tên để điều chỉnh thứ tự phát.
            </DialogDescription>
          </DialogHeader>

          {/* Feedback banners for reorder */}
          {reorderError && (
            <div className="flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{reorderError}</span>
            </div>
          )}
          {reorderSuccessMsg && (
            <div className="flex items-start gap-2 rounded-lg bg-success/10 border border-success/30 p-2.5 text-xs text-success">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{reorderSuccessMsg}</span>
            </div>
          )}

          {/* Add episode form */}
          <form onSubmit={handleAddEpisode} className="flex gap-2 pt-2 border-t border-border">
            <select
              value={addVideoId}
              onChange={(e) => setAddVideoId(e.target.value)}
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">-- Chọn video/podcast để thêm vào tuyển tập --</option>
              {creatorVideos.map((v) => (
                <option key={v.contentId} value={v.contentId}>
                  {v.title} — {getContentStatusBadge(v.status).label}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              size="sm"
              disabled={!addVideoId || addEpisodeMutation.isPending || reorderMutation.isPending}
              className="gap-1.5 bg-accent text-white"
            >
              {addEpisodeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Thêm tập</span>
            </Button>
          </form>

          {/* Episodes list */}
          <div className="flex-1 overflow-y-auto space-y-2 py-4">
            {isLoadingDetail ? (
              <div className="py-8 text-center text-xs text-ink-muted">Đang tải danh sách tập...</div>
            ) : !seriesDetail?.items || seriesDetail.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
                <Film className="mx-auto h-8 w-8 text-ink-muted mb-2 opacity-60" />
                <p className="text-xs text-ink-muted">Tuyển tập này chưa có tập nào.</p>
                <p className="text-[11px] text-ink-muted mt-1">
                  Chọn video từ danh sách phía trên để thêm vào tuyển tập.
                </p>
              </div>
            ) : (
              seriesDetail.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-subtle font-mono text-xs font-bold text-accent shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-ink truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                        <span>Thời lượng: {formatDuration(item.durationSeconds)}</span>
                        {item.isExclusive && (
                          <Badge variant="default" className="text-[9px] bg-amber-600 text-white px-1.5 py-0">
                            VIP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Move Up, Move Down, Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canMoveUp(idx) || reorderMutation.isPending}
                      onClick={() => handleMoveEpisode(idx, idx - 1)}
                      className="h-8 w-8 p-0 text-ink-muted hover:text-accent disabled:opacity-25 disabled:pointer-events-none"
                      title="Di chuyển lên trên"
                      aria-label={`Di chuyển tập ${item.title} lên trên`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canMoveDown(idx, seriesDetail.items.length) || reorderMutation.isPending}
                      onClick={() => handleMoveEpisode(idx, idx + 1)}
                      className="h-8 w-8 p-0 text-ink-muted hover:text-accent disabled:opacity-25 disabled:pointer-events-none"
                      title="Di chuyển xuống dưới"
                      aria-label={`Di chuyển tập ${item.title} xuống dưới`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removeEpisodeMutation.isPending || reorderMutation.isPending}
                      onClick={() =>
                        managingSeriesId &&
                        removeEpisodeMutation.mutate({
                          seriesId: managingSeriesId,
                          contentId: item.contentId,
                        })
                      }
                      className="h-8 w-8 p-0 text-ink-muted hover:text-danger shrink-0"
                      title="Gỡ khỏi tuyển tập"
                      aria-label={`Gỡ tập ${item.title} khỏi tuyển tập`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setManagingSeriesId(null);
                setReorderError(null);
                setReorderSuccessMsg(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
