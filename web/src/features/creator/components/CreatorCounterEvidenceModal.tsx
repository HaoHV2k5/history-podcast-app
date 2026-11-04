import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Paperclip,
  FileText,
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
import { DisputeItem, DisputeEvidenceUploadResponse } from '@/types/dispute';
import { stripUrlsFromText, extractUrlsFromText } from '@/features/disputes/disputesLogic';

interface CreatorCounterEvidenceModalProps {
  dispute: DisputeItem | null;
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

export const CreatorCounterEvidenceModal: React.FC<CreatorCounterEvidenceModalProps> = ({
  dispute,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [counterEvidence, setCounterEvidence] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<DisputeEvidenceUploadResponse[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dispute && isOpen) {
      setCounterEvidence(stripUrlsFromText(dispute.counterEvidence));
      const existingUrls = extractUrlsFromText(
        dispute.counterEvidence,
        dispute.counterEvidenceUrls
      );
      setUploadedFiles(
        existingUrls.map((url) => ({
          fileUrl: url,
          fileName: url.split('/').pop() || 'evidence',
          fileSize: 0,
          contentType: isImageUrlOrType(url) ? 'image/jpeg' : 'application/octet-stream',
        }))
      );
    }
  }, [dispute, isOpen]);

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
          'Không thể tải tệp đối chất lên. Vui lòng thử lại.'
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

  const counterEvidenceMutation = useMutation({
    mutationFn: () => {
      if (!dispute) throw new Error('Không tìm thấy thông tin khiếu nại');
      const attachmentUrls = uploadedFiles.map((f) => f.fileUrl).filter(Boolean);
      if (!counterEvidence.trim() && attachmentUrls.length === 0) {
        throw new Error(
          'Vui lòng nhập nội dung giải trình đối chất hoặc đính kèm ít nhất 1 tệp bằng chứng.'
        );
      }

      return disputesApi.submitCounterEvidence(dispute.id, {
        counterEvidence:
          counterEvidence.trim() || 'Đính kèm tệp bằng chứng giải trình đối chất',
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-contract-detail', dispute?.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-disputes', dispute?.contractId] });
      setCounterEvidence('');
      setUploadedFiles([]);
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi bằng chứng đối chất');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterEvidence.trim() && uploadedFiles.length === 0) {
      setError('Vui lòng nhập nội dung giải trình hoặc chọn ít nhất 1 tệp bằng chứng.');
      return;
    }
    counterEvidenceMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-x-hidden">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Bằng chứng đối chất tranh chấp #{dispute?.id}
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink break-words">
            Giải Trình Đối Chất — {dispute?.milestoneTitle || `Cột mốc #${dispute?.milestoneId}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            Người khiếu nại: <strong>{dispute?.raisedByUserFullName || 'Đối tác'}</strong>. Cung cấp căn cứ thực tế và đính kèm tệp/ảnh bằng chứng để Admin xem xét khách quan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Dispute Context */}
          {dispute?.reason && (
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1.5 break-words">
              <span className="font-bold text-[10px] uppercase text-rose-700 block">
                Lý do khiếu nại ban đầu:
              </span>
              <p className="italic text-rose-800 leading-relaxed">&ldquo;{dispute.reason}&rdquo;</p>
              {stripUrlsFromText(dispute.evidence) && (
                <p className="text-[11px] text-stone-600 pt-1.5 border-t border-rose-100 whitespace-pre-line">
                  <strong>Bằng chứng kèm theo:</strong> {stripUrlsFromText(dispute.evidence)}
                </p>
              )}
              {extractUrlsFromText(dispute.evidence, dispute.evidenceUrls).length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1.5">
                  {extractUrlsFromText(dispute.evidence, dispute.evidenceUrls).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-rose-200 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {url.split('/').pop() || `Tệp bằng chứng #${idx + 1}`}
                      </span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Counter Evidence Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>
                Nội dung giải trình đối chất của bạn <span className="text-accent">*</span>
              </span>
              <span className="text-[10px] text-stone-400">Văn bản giải trình</span>
            </label>
            <Textarea
              value={counterEvidence}
              onChange={(e) => setCounterEvidence(e.target.value)}
              placeholder="Giải trình cụ thể các điểm đối chất (ví dụ: Tôi đã nộp file sản phẩm hoàn chỉnh ở bản v2 và thực hiện đúng thỏa thuận trong phòng Chat 1-1)..."
              className="text-xs min-h-[90px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={counterEvidenceMutation.isPending || isUploadingFile}
            />
          </div>

          {/* File & Image Counter-Evidence Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">
                Tệp &amp; Ảnh bằng chứng đối chất đính kèm
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
              disabled={isUploadingFile || counterEvidenceMutation.isPending}
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
                      ? 'Đang tải tệp đối chất lên hệ thống...'
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
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1F1A19] truncate" title={file.fileName}>
                            {file.fileName || file.fileUrl.split('/').pop()}
                          </p>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-[#A31D24] hover:underline font-medium"
                          >
                            <span>Mở xem tệp</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
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

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={counterEvidenceMutation.isPending || isUploadingFile}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                counterEvidenceMutation.isPending ||
                isUploadingFile ||
                (!counterEvidence.trim() && uploadedFiles.length === 0)
              }
              className="text-xs h-9 px-5 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs active:scale-[0.98]"
            >
              {counterEvidenceMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang gửi đối chất...
                </>
              ) : (
                'Gửi giải trình'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
