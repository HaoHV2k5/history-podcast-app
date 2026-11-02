import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  X,
  AlertCircle,
  Loader2,
  FileCheck,
  Eye,
  History,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { deliverablesApi } from '@/services/api/deliverables';
import { MilestoneItem } from '@/types/contract';
import { MilestoneDeliverableItem } from '@/types/deliverable';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { DeliverableMediaModal } from './DeliverableMediaModal';

interface CreatorUploadDeliverableModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorUploadDeliverableModal: React.FC<CreatorUploadDeliverableModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDeliverable, setPreviewDeliverable] = useState<MilestoneDeliverableItem | null>(null);

  const { data: existingResponse } = useQuery({
    queryKey: ['milestone-deliverables', milestone?.id],
    queryFn: () => {
      if (!milestone?.id) throw new Error('Không có ID milestone');
      return deliverablesApi.getDeliverablesByMilestone(milestone.id);
    },
    enabled: Boolean(milestone?.id) && isOpen,
  });

  const existingDeliverables: MilestoneDeliverableItem[] = existingResponse?.data || [];
  const nextVersionNo = existingDeliverables.length + 1;

  // File size formatter
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper file icon selector
  const renderFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi') {
      return <FileVideo className="h-7 w-7 text-rose-500" />;
    }
    if (ext === 'mp3' || ext === 'wav' || ext === 'm4a') {
      return <FileAudio className="h-7 w-7 text-amber-500" />;
    }
    if (ext === 'zip' || ext === 'rar') {
      return <FileArchive className="h-7 w-7 text-indigo-500" />;
    }
    return <FileText className="h-7 w-7 text-emerald-600" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!milestone) throw new Error('Không tìm thấy thông tin Milestone');
      if (!selectedFile) throw new Error('Vui lòng chọn tệp sản phẩm bàn giao từ máy tính');

      return deliverablesApi.uploadDeliverable(
        milestone.id,
        selectedFile,
        title.trim() || undefined,
        description.trim() || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      queryClient.invalidateQueries({ queryKey: ['creator-my-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-deliverables', milestone?.id] });
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải lên sản phẩm bàn giao');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Vui lòng chọn tệp sản phẩm từ máy tính.');
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto p-6 bg-[#FAF8F4] rounded-2xl border border-[#DFD6C7] shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-3 border-b border-[#E5DEC9]">
            <div className="flex items-center gap-2 text-[#9B2C2C]">
              <FileCheck className="h-5 w-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Bàn giao sản phẩm nghiệm thu (Phiên bản v{nextVersionNo})
              </span>
            </div>
            <DialogTitle className="text-base font-bold font-serif text-[#262522]">
              Nộp Thành phẩm — Giai đoạn #{milestone?.orderNo}: {milestone?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#696660] leading-relaxed">
              Yêu cầu cam kết: &ldquo;{milestone?.requirement || 'Hoàn thiện theo thỏa thuận'}&rdquo;.
              Sản phẩm được lưu trữ riêng tư trong hợp đồng và gửi tới khách hàng để nghiệm thu.
            </DialogDescription>
          </DialogHeader>

          {/* Previously Submitted Versions Section (if already submitted before) */}
          {existingDeliverables.length > 0 && (
            <div className="mt-3 rounded-xl border border-[#E5DEC9] bg-white p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#4A4843] flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-[#9B2C2C]" />
                  Sản phẩm đã nộp trước đó ({existingDeliverables.length} phiên bản)
                </span>
                <span className="text-[10px] text-[#78746C]">
                  Có thể xem lại bản cũ trước khi nộp bản mới
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {existingDeliverables.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 rounded-lg border border-[#EFE9DC] bg-[#FAF8F4] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#FBF4F3] text-[#9B2C2C] border border-[#E8D5D2]">
                          v{item.versionNo}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#F3F8F5] text-[#166534]">
                            Hiện tại
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[#262522] truncate">
                          {item.title || item.fileName}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-[#78746C] truncate mt-0.5">
                        {item.fileName} • {formatFileSize(item.fileSize)} • {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDeliverable(item)}
                      className="h-7 px-2.5 text-[11px] rounded-lg border-[#DFD6C7] bg-white text-[#262522] hover:bg-[#F3EFE6] shrink-0 flex items-center gap-1 font-medium"
                    >
                      <Eye className="h-3 w-3 text-[#9B2C2C]" />
                      <span>Xem lại</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* File Picker / Drag & Drop Area - Strict rule: NO URL INPUT */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#3B3935] flex items-center justify-between">
                <span>
                  {existingDeliverables.length > 0
                    ? `Chọn tệp cho phiên bản mới (v${nextVersionNo})`
                    : 'Tệp sản phẩm hoàn thiện'}{' '}
                  <span className="text-[#9B2C2C]">*</span>
                </span>
                <span className="text-[10px] text-[#78746C]">
                  Video, Audio, PDF, DOC/DOCX, TXT, ZIP (≤ 25MB)
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.webm,.mp3,.wav,.m4a,.pdf,.docx,.doc,.txt,.zip,.rar"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2',
                    dragOver
                      ? 'border-[#9B2C2C] bg-[#FBF4F3]'
                      : 'border-[#D5CBB8] bg-white hover:bg-[#F5F1E8] hover:border-[#B8AC96]'
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF4F3] text-[#9B2C2C]">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#262522]">
                      Bấm để chọn tệp hoặc kéo thả file vào đây
                    </p>
                    <p className="text-[11px] text-[#696660]">
                      Hỗ trợ MP4, MOV, MP3, WAV, PDF, DOC/DOCX, TXT, ZIP/RAR (Tối đa 25MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#DFD6C7] bg-white p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{renderFileIcon(selectedFile.name)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#262522] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-[#696660] font-mono">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                    title="Chọn lại tệp khác"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#3B3935]">
                Tiêu đề bản nộp
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Ví dụ: Bản dựng hoàn thiện Tập 1 FullHD v${nextVersionNo}`}
                className="text-xs h-9 rounded-xl border-[#DFD6C7] bg-white focus:border-[#9B2C2C]"
                disabled={uploadMutation.isPending}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#3B3935]">
                Ghi chú cho Khách hàng
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả các nội dung đã hoàn thành, lưu ý khi xem hoặc kiểm tra..."
                className="text-xs min-h-[70px] rounded-xl border-[#DFD6C7] bg-white focus:border-[#9B2C2C] resize-none"
                disabled={uploadMutation.isPending}
              />
            </div>

            {error && (
              <div className="p-3 text-xs text-[#9B2C2C] bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5DEC9]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploadMutation.isPending}
                className="text-xs h-9 px-4 rounded-xl border-[#DFD6C7] bg-white text-[#4A4843]"
              >
                Đóng
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending || !selectedFile}
                className="text-xs h-9 px-5 rounded-xl bg-[#9B2C2C] text-white hover:bg-[#822222] font-semibold transition-all shadow-xs"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Đang tải lên...
                  </>
                ) : existingDeliverables.length > 0 ? (
                  `Nộp bản mới (v${nextVersionNo})`
                ) : (
                  'Bàn giao sản phẩm (v1)'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Media Preview Modal for previously submitted deliverables */}
      <DeliverableMediaModal
        deliverable={previewDeliverable}
        isOpen={Boolean(previewDeliverable)}
        onClose={() => setPreviewDeliverable(null)}
      />
    </>
  );
};
