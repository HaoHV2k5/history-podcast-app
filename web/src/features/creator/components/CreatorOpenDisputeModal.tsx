import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { disputesApi } from '@/services/api/disputes';
import { MilestoneItem } from '@/types/contract';
import { DisputeEvidenceUploadResponse } from '@/types/dispute';

interface CreatorOpenDisputeModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function isImageUrlOrType(urlOrName: string, contentType?: string): boolean {
  if (contentType && contentType.toLowerCase().startsWith('image/')) return true;
  const lower = (urlOrName || '').toLowerCase();
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif')
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const CreatorOpenDisputeModal: React.FC<CreatorOpenDisputeModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<DisputeEvidenceUploadResponse[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setError(null);
    setIsUploadingFile(true);

    try {
      const filesArray = Array.from(fileList);
      for (const file of filesArray) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Tệp "${file.name}" vượt quá giới hạn 10MB.`);
        }
        const res = await disputesApi.uploadEvidenceFile(file);
        if (res.data?.fileUrl) {
          setUploadedFiles((prev) => [...prev, res.data]);
        }
      }
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        anyErr.response?.data?.message ||
          anyErr.message ||
          'Không thể tải tệp bằng chứng lên. Vui lòng thử lại.'
      );
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const disputeMutation = useMutation({
    mutationFn: () => {
      if (!milestone) throw new Error('Không tìm thấy thông tin Milestone');
      if (!reason.trim()) throw new Error('Vui lòng nêu rõ lý do mở khiếu nại tranh chấp.');

      const attachmentUrls = uploadedFiles.map((f) => f.fileUrl).filter(Boolean);

      return disputesApi.openDispute({
        milestoneId: milestone.id,
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-contract-detail', milestone?.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-disputes', milestone?.contractId] });
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      setReason('');
      setEvidence('');
      setUploadedFiles([]);
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu khiếu nại');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do khiếu nại chi tiết.');
      return;
    }
    disputeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-x-hidden">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Khiếu nại &amp; Tranh chấp Escrow
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink break-words">
            Mở Khiếu Nại — Giai đoạn #{milestone?.orderNo}: {milestone?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            Khoản tiền bảo chứng của giai đoạn này sẽ được{' '}
            <strong>đóng băng an toàn (FROZEN)</strong> để Admin nền tảng thụ lý và phân xử công bằng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>
                Lý do khiếu nại <span className="text-accent">*</span>
              </span>
              <span className="text-[10px] text-stone-400">Bắt buộc</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ bất đồng hoặc vi phạm cam kết (ví dụ: Khách yêu cầu sửa đổi vượt quá thỏa thuận kịch bản ban đầu)..."
              className="text-xs min-h-[80px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={disputeMutation.isPending || isUploadingFile}
            />
          </div>

          {/* Evidence Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Mô tả chi tiết bằng chứng &amp; đối soát</span>
              <span className="text-[10px] text-stone-400">Tùy chọn</span>
            </label>
            <Textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Mô tả chi tiết điểm sai lệch, mốc thời gian hoặc thỏa thuận trong phòng Chat 1-1..."
              className="text-xs min-h-[70px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={disputeMutation.isPending || isUploadingFile}
            />
          </div>

          {/* File & Image Evidence Upload Section (Synced with Mobile App) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">
                Tệp &amp; Ảnh bằng chứng đính kèm
              </label>
              <span className="text-[10px] text-stone-400 font-mono tabular-nums">
                Đã đính kèm: {uploadedFiles.length} tệp
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.wav,.mp4,.mov,.zip,.rar"
              onChange={handlePickFiles}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile || disputeMutation.isPending}
              className="w-full rounded-xl border border-dashed border-[#D6CEBF] bg-[#FAF8F5] hover:bg-[#F3EFE6] hover:border-[#A31D24]/60 px-4 py-3 text-left transition-all cursor-pointer flex items-center justify-between gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDF2F2] text-[#A31D24]">
                  {isUploadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1F1A19] truncate">
                    {isUploadingFile
                      ? 'Đang tải tệp bằng chứng lên hệ thống...'
                      : 'Chọn ảnh hoặc tệp bằng chứng từ thiết bị'}
                  </p>
                  <p className="text-[11px] text-[#786D66] truncate">
                    Hỗ trợ ảnh (PNG, JPG, WEBP), PDF, DOC, TXT, MP3, WAV, MP4, ZIP (Tối đa 10MB/tệp)
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-white border border-[#E5E0D8] px-2.5 py-1 text-[11px] font-semibold text-[#A31D24]">
                + Chọn tệp
              </span>
            </button>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto pr-1">
                {uploadedFiles.map((file, idx) => {
                  const isImg = isImageUrlOrType(file.fileName || file.fileUrl, file.contentType);
                  return (
                    <div
                      key={`${file.fileUrl}-${idx}`}
                      className="flex items-center justify-between gap-2.5 rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isImg ? (
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="h-9 w-9 rounded-lg object-cover border border-[#E5E0D8] shrink-0 bg-white"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E0D8] text-[#A31D24]">
                            {isImg ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1F1A19] truncate" title={file.fileName}>
                            {file.fileName || file.fileUrl.split('/').pop()}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#786D66]">
                            {file.fileSize > 0 && (
                              <span className="font-mono tabular-nums">
                                {formatFileSize(file.fileSize)}
                              </span>
                            )}
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[#A31D24] hover:underline font-medium"
                            >
                              <span>Xem tệp</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        title="Gỡ tệp này"
                        className="h-7 w-7 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Policy Notice Box */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Quy trình xử lý tranh chấp của Admin:</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Sau khi bạn gửi khiếu nại, đối tác sẽ nhận được thông báo để gửi bằng chứng đối chất. Admin sẽ căn cứ vào kịch bản gốc và thành phẩm để ra quyết định phân xử (Giải ngân, Hoàn tiền hoặc Chia tỷ lệ).
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={disputeMutation.isPending || isUploadingFile}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={disputeMutation.isPending || isUploadingFile || !reason.trim()}
              className="text-xs h-9 px-5 rounded-xl bg-rose-700 text-white hover:bg-rose-800 font-semibold transition-all shadow-xs active:scale-[0.98]"
            >
              {disputeMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang gửi khiếu nại...
                </>
              ) : (
                'Gửi khiếu nại'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
