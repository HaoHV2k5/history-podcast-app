import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  Download,
  Eye,
  Clock,
  Layers,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deliverablesApi } from '@/services/api/deliverables';
import { MilestoneDeliverableItem } from '@/types/deliverable';
import { MilestoneItem } from '@/types/contract';
import { formatDateTime } from '@/utils/formatters';
import { DeliverableMediaModal } from './DeliverableMediaModal';

interface CreatorDeliverablesListModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload?: () => void;
}

export const CreatorDeliverablesListModal: React.FC<CreatorDeliverablesListModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onOpenUpload,
}) => {
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MilestoneDeliverableItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['milestone-deliverables', milestone?.id],
    queryFn: () => {
      if (!milestone?.id) throw new Error('Không có ID milestone');
      return deliverablesApi.getDeliverablesByMilestone(milestone.id);
    },
    enabled: Boolean(milestone?.id) && isOpen,
  });

  const deliverables: MilestoneDeliverableItem[] = response?.data || [];

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi') {
      return <FileVideo className="h-6 w-6 text-rose-500" />;
    }
    if (ext === 'mp3' || ext === 'wav' || ext === 'm4a') {
      return <FileAudio className="h-6 w-6 text-amber-500" />;
    }
    if (ext === 'zip' || ext === 'rar') {
      return <FileArchive className="h-6 w-6 text-indigo-500" />;
    }
    return <FileText className="h-6 w-6 text-emerald-600" />;
  };

  const handleDownload = async (item: MilestoneDeliverableItem) => {
    try {
      setDownloadingId(item.id);
      await deliverablesApi.downloadDeliverableFile(item.id, item.fileName);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi khi tải file');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent">
                <FolderOpen className="h-5 w-5" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                  Lịch sử phiên bản thành phẩm
                </span>
              </div>
              {onOpenUpload && milestone?.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenUpload();
                  }}
                  className="h-7.5 px-3 text-xs rounded-xl bg-accent text-white hover:bg-accent-hover font-medium shadow-2xs active:scale-[0.98] transition-all"
                >
                  Nộp bản mới (v{(deliverables.length || 0) + 1})
                </Button>
              )}
            </div>
            <DialogTitle className="text-base font-bold font-serif text-ink break-words">
              Giai đoạn #{milestone?.orderNo}: {milestone?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Danh sách tất cả các phiên bản tệp thành phẩm đã bàn giao cho giai đoạn này.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                <RefreshCw className="h-5 w-5 animate-spin text-accent" />
                <span>Đang tải danh sách thành phẩm...</span>
              </div>
            )}

            {isError && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-accent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Không thể tải danh sách tệp thành phẩm.</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs">
                  Thử lại
                </Button>
              </div>
            )}

            {!isLoading && !isError && deliverables.length === 0 && (
              <div className="py-10 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-6 space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/60 text-stone-500">
                  <Layers className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-stone-700">Chưa có tệp thành phẩm nào</p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Giai đoạn này chưa được tải lên file bàn giao. Bạn có thể chọn file trực tiếp từ máy tính để bàn giao cho khách hàng.
                </p>
              </div>
            )}

            {!isLoading &&
              !isError &&
              deliverables.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all duration-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">{renderFileIcon(item.fileName)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-accent border border-rose-200/60">
                            Phiên bản v{item.versionNo}
                          </span>
                          <h5 className="text-xs font-bold text-stone-900 truncate">
                            {item.title || item.fileName}
                          </h5>
                        </div>
                        <p className="text-[11px] font-mono text-stone-500 mt-0.5 truncate">
                          {item.fileName} • {formatFileSize(item.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPreviewItem(item)}
                        className="h-7.5 px-2.5 text-xs rounded-lg border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center gap-1 active:scale-[0.98] transition-all"
                        title="Xem/Nghe trực tiếp"
                      >
                        <Eye className="h-3.5 w-3.5 text-accent" />
                        <span className="hidden sm:inline">Xem</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId === item.id}
                        className="h-7.5 px-2.5 text-xs rounded-lg border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center gap-1 active:scale-[0.98] transition-all"
                        title="Tải tệp về máy"
                      >
                        {downloadingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">Tải về</span>
                      </Button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-stone-600 bg-stone-50/70 p-2.5 rounded-lg border border-stone-150 leading-relaxed break-words">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Đã tải lên lúc: {formatDateTime(item.createdAt)}
                    </span>
                    {item.uploadedByFullName && (
                      <span className="truncate max-w-[150px]">Bởi: {item.uploadedByFullName}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliverable Media Preview Modal */}
      <DeliverableMediaModal
        deliverable={selectedPreviewItem}
        isOpen={Boolean(selectedPreviewItem)}
        onClose={() => setSelectedPreviewItem(null)}
      />
    </>
  );
};
