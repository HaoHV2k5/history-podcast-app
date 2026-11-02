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
  UploadCloud,
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
  const canUploadNewVersion =
    Boolean(onOpenUpload) &&
    (milestone?.status === 'IN_PROGRESS' || milestone?.status === 'SUBMITTED');

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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-[#FAF8F4] rounded-2xl border border-[#DFD6C7] shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-3 border-b border-[#E5DEC9]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-[#9B2C2C]">
                <FolderOpen className="h-5 w-5" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                  Lịch sử phiên bản thành phẩm ({deliverables.length})
                </span>
              </div>
              {canUploadNewVersion && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenUpload?.();
                  }}
                  className="h-8 px-3 text-xs rounded-xl bg-[#9B2C2C] text-white hover:bg-[#822222] font-semibold shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>
                    {deliverables.length > 0
                      ? `Nộp bản cập nhật mới (v${deliverables.length + 1})`
                      : 'Nộp thành phẩm bàn giao (v1)'}
                  </span>
                </Button>
              )}
            </div>
            <DialogTitle className="text-base font-bold font-serif text-[#262522] break-words">
              Giai đoạn #{milestone?.orderNo}: {milestone?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#696660]">
              Xem lại hoặc tải về các phiên bản sản phẩm đã nộp trước đó trước khi quyết định cập nhật phiên bản mới.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                <RefreshCw className="h-5 w-5 animate-spin text-[#9B2C2C]" />
                <span>Đang tải danh sách thành phẩm...</span>
              </div>
            )}

            {isError && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-[#9B2C2C] flex items-center justify-between">
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
              <div className="py-10 text-center rounded-xl border border-dashed border-[#DFD6C7] bg-white p-6 space-y-2.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F3EFE6] text-[#696660]">
                  <Layers className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#262522]">Chưa có tệp thành phẩm nào được nộp</p>
                <p className="text-[11px] text-[#696660] max-w-sm mx-auto leading-relaxed">
                  Giai đoạn này chưa có sản phẩm bàn giao nào. Khi khách hàng đã ký quỹ mốc này, bạn có thể tải tệp sản phẩm từ máy tính lên để bàn giao.
                </p>
                {canUploadNewVersion && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenUpload?.();
                      }}
                      className="h-8 px-4 text-xs rounded-xl bg-[#9B2C2C] text-white hover:bg-[#822222] font-semibold"
                    >
                      <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                      Tải tệp bàn giao lên ngay
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!isLoading &&
              !isError &&
              deliverables.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E5DEC9] bg-white p-4 shadow-2xs hover:border-[#D5CBB8] transition-all duration-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">{renderFileIcon(item.fileName)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-[#FBF4F3] text-[#9B2C2C] border border-[#E8D5D2]">
                            Phiên bản v{item.versionNo}
                          </span>
                          {idx === 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3F8F5] text-[#166534] border border-[#D4E7DC]">
                              Bản mới nhất
                            </span>
                          )}
                          <h5 className="text-xs font-bold text-[#262522] truncate">
                            {item.title || item.fileName}
                          </h5>
                        </div>
                        <p className="text-[11px] font-mono text-[#696660] mt-0.5 truncate">
                          {item.fileName} • {formatFileSize(item.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPreviewItem(item)}
                        className="h-8 px-2.5 text-xs rounded-lg border-[#DFD6C7] bg-[#FAF8F4] text-[#262522] hover:bg-[#F3EFE6] flex items-center gap-1.5 font-medium active:scale-[0.98] transition-all"
                        title="Xem hoặc nghe trực tiếp sản phẩm này"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#9B2C2C]" />
                        <span>Xem sản phẩm</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId === item.id}
                        className="h-8 px-2.5 text-xs rounded-lg border-[#DFD6C7] bg-white text-[#5C5852] hover:bg-[#FAF8F4] flex items-center gap-1 active:scale-[0.98] transition-all"
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
                    <p className="text-xs text-[#4A4843] bg-[#FAF8F4] p-2.5 rounded-lg border border-[#EFE9DC] leading-relaxed break-words">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#78746C] pt-1 border-t border-[#F3EFE6]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Đã nộp lúc: {formatDateTime(item.createdAt)}
                    </span>
                    {item.uploadedByFullName && (
                      <span className="truncate max-w-[180px]">Người nộp: {item.uploadedByFullName}</span>
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
