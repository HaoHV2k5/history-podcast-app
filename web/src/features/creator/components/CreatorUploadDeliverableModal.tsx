import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { cn } from '@/utils/cn';

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

  // File size formatter
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper file icon selector
  const renderFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi') {
      return <FileVideo className="h-8 w-8 text-rose-500" />;
    }
    if (ext === 'mp3' || ext === 'wav' || ext === 'm4a') {
      return <FileAudio className="h-8 w-8 text-amber-500" />;
    }
    if (ext === 'zip' || ext === 'rar') {
      return <FileArchive className="h-8 w-8 text-indigo-500" />;
    }
    return <FileText className="h-8 w-8 text-emerald-600" />;
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-accent">
            <FileCheck className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Bàn giao sản phẩm nghiệm thu
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink">
            Nộp Thành phẩm — Giai đoạn #{milestone?.orderNo}: {milestone?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            Yêu cầu cam kết: &ldquo;{milestone?.requirement || 'Hoàn thiện theo thỏa thuận'}&rdquo;.
            Sản phẩm được lưu trữ riêng tư an toàn trong hợp đồng và gửi tới khách hàng để nghiệm thu trong 3 ngày.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Picker / Drag & Drop Area - Strict rule: NO URL INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Tệp sản phẩm hoàn thiện <span className="text-accent">*</span></span>
              <span className="text-[10px] text-stone-400">Video, Audio, PDF, DOCX, ZIP</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.mp3,.wav,.pdf,.docx,.doc,.zip,.rar"
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
                    ? 'border-accent bg-rose-50/50'
                    : 'border-stone-300 bg-stone-50/60 hover:bg-stone-50 hover:border-stone-400'
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100/70 text-accent">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-stone-800">
                    Bấm để chọn tệp hoặc kéo thả file vào đây
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Hỗ trợ MP4, MOV, MP3, WAV, PDF, DOCX, ZIP (Tải trực tiếp từ máy)
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">{renderFileIcon(selectedFile)}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">
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
            <label className="text-xs font-semibold text-stone-700">
              Tiêu đề bản nộp
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Bản dựng hoàn thiện Tập 1 FullHD v1"
              className="text-xs h-9 rounded-xl border-stone-300 focus:border-accent"
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">
              Ghi chú cho Khách hàng
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả các nội dung đã hoàn thành, lưu ý khi xem hoặc kiểm tra..."
              className="text-xs min-h-[70px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={uploadMutation.isPending}
            />
          </div>

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploadMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="text-xs h-9 px-5 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                'Bàn giao sản phẩm'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
