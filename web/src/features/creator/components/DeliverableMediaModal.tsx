import React, { useState, useEffect } from 'react';
import {
  FileAudio,
  FileArchive,
  Download,
  Loader2,
  AlertCircle,
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

interface DeliverableMediaModalProps {
  deliverable: MilestoneDeliverableItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeliverableMediaModal: React.FC<DeliverableMediaModalProps> = ({
  deliverable,
  isOpen,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (!deliverable || !isOpen) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    deliverablesApi
      .getDeliverableBlobUrl(deliverable.id, deliverable.fileName)
      .then((res) => {
        if (isMounted) {
          setBlobUrl(res.url);
          setMimeType(res.mimeType);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.message || err.message || 'Không thể tải bản xem trước file sản phẩm'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [deliverable?.id, isOpen]);

  const handleDownload = async () => {
    if (!deliverable) return;
    try {
      setDownloading(true);
      await deliverablesApi.downloadDeliverableFile(deliverable.id, deliverable.fileName);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi khi tải file');
    } finally {
      setDownloading(false);
    }
  };

  const ext = deliverable?.fileName?.split('.').pop()?.toLowerCase() || '';
  const isVideo = ['mp4', 'mov', 'webm', 'mkv'].includes(ext) || mimeType.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'm4a', 'ogg'].includes(ext) || mimeType.startsWith('audio/');
  const isPdf = ext === 'pdf' || mimeType === 'application/pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || mimeType.startsWith('image/');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="pl-5 pr-12 py-4 border-b border-stone-200/80 bg-stone-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-accent border border-rose-200/60">
                  Phiên bản v{deliverable?.versionNo}
                </span>
                <DialogTitle className="text-sm font-bold font-serif text-ink truncate">
                  {deliverable?.title || deliverable?.fileName}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-stone-500 font-mono truncate mt-0.5">
                {deliverable?.fileName}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={downloading}
                className="h-8 px-3 text-xs rounded-xl border-stone-300 text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 active:scale-[0.98] transition-all"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-accent" />
                )}
                <span>Tải về</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Media Preview Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center min-h-[320px] bg-stone-900/5">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-stone-500">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
              <span>Đang kết nối luồng phát tệp bảo mật...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-accent flex flex-col items-center gap-2 max-w-md text-center">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={handleDownload} className="mt-2 h-7.5 text-xs">
                Tải file trực tiếp về máy
              </Button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <div className="w-full max-w-2xl flex flex-col items-center justify-center">
              {isVideo && (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                  <video
                    src={blobUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Trình duyệt của bạn không hỗ trợ phát video trực tiếp.
                  </video>
                </div>
              )}

              {isAudio && (
                <div className="w-full p-6 rounded-2xl bg-white border border-stone-200 shadow-md space-y-4 text-center">
                  <div className="h-16 w-16 mx-auto rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <FileAudio className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-stone-900 font-serif">
                      {deliverable?.title || deliverable?.fileName}
                    </h5>
                    <p className="text-xs text-stone-500 font-mono">Bản ghi âm chất lượng cao</p>
                  </div>
                  <audio src={blobUrl} controls className="w-full mx-auto" />
                </div>
              )}

              {isPdf && (
                <div className="w-full h-[500px] rounded-xl overflow-hidden border border-stone-200 bg-white shadow-md">
                  <iframe src={blobUrl} title={deliverable?.fileName} className="w-full h-full" />
                </div>
              )}

              {isImage && (
                <div className="max-h-[500px] rounded-xl overflow-hidden shadow-md">
                  <img src={blobUrl} alt={deliverable?.fileName} className="max-h-[500px] object-contain" />
                </div>
              )}

              {!isVideo && !isAudio && !isPdf && !isImage && (
                <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center space-y-3 shadow-md max-w-md">
                  <div className="h-16 w-16 mx-auto rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                    <FileArchive className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-stone-900 font-serif">
                      {deliverable?.fileName}
                    </h5>
                    <p className="text-xs text-stone-500">
                      Tệp nén hoặc tài liệu định dạng đặc biệt. Vui lòng tải về máy để giải nén hoặc xem nội dung.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="h-9 px-5 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold shadow-xs"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    <span>Tải tệp về máy</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with note */}
        {deliverable?.description && (
          <div className="px-5 py-3 border-t border-stone-200/80 bg-stone-50/50 text-xs text-stone-600">
            <span className="font-semibold text-stone-700">Ghi chú bàn giao: </span>
            <span>{deliverable.description}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

