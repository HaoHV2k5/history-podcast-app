/**
 * SceneImageUploadDropzone Component
 * PRM232 - Sử Ký History Podcast Platform
 *
 * Dedicated, accessible drag-and-drop & clipboard paste image upload zone for:
 * 1. Whiteboard animation individual scene images (16:9).
 * 2. Audio Podcast cover art (1:1 / 16:9).
 * 3. Thumbnail Poster (16:9).
 *
 * Features:
 * - Robust Ctrl+V / Cmd+V paste support (handles items and files across OS)
 * - 1-Click "Dán ảnh (Ctrl+V)" button using navigator.clipboard
 * - Zero black border (seamless warm parchment #FAF8F5 background, p-0 on image)
 * - Clear visual feedback on hover/focus (ready for Ctrl+V)
 * - Client-side validation (format & size)
 * - Replace and remove actions
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Clipboard,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateMediaFile } from '../creatorStudioUtils';

interface SceneImageUploadDropzoneProps {
  label: string;
  sublabel?: string;
  imageUrl?: string;
  isUploading?: boolean;
  aspectRatio?: '16:9' | '1:1';
  onFileSelect: (file: File) => void;
  onRemoveImage?: () => void;
  disabled?: boolean;
}

export const SceneImageUploadDropzone: React.FC<SceneImageUploadDropzoneProps> = ({
  label,
  sublabel,
  imageUrl,
  isUploading = false,
  aspectRatio = '16:9',
  onFileSelect,
  onRemoveImage,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pasteSuccessToast, setPasteSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) return;
    const file = files[0];
    const validation = validateMediaFile(file);

    if (!validation.isValid) {
      setValidationError(validation.error || 'Tệp tin không hợp lệ');
      return;
    }

    setValidationError(null);
    onFileSelect(file);
  };

  /**
   * Trích xuất tệp ảnh từ ClipboardEvent với độ tương thích cao trên cả Mac, Windows, Chrome, Safari.
   * Ưu tiên e.clipboardData.files (ảnh sao chép từ file desktop) và e.clipboardData.items (ảnh chụp màn hình).
   */
  const extractImageFromClipboard = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent): File | null => {
      // 1. Kiểm tra e.clipboardData.files trước
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            return files[i];
          }
        }
      }

      // 2. Kiểm tra e.clipboardData.items
      const items = e.clipboardData?.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) return file;
          }
        }
      }
      return null;
    },
    []
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (disabled || isUploading) return;

      const file = extractImageFromClipboard(e);
      if (!file) return;

      e.preventDefault();
      e.stopPropagation();

      const validation = validateMediaFile(file);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Tệp tin không hợp lệ');
        return;
      }

      setValidationError(null);
      setPasteSuccessToast(true);
      setTimeout(() => setPasteSuccessToast(false), 2000);
      onFileSelect(file);
    },
    [disabled, isUploading, extractImageFromClipboard, onFileSelect]
  );

  /**
   * Lắng nghe sự kiện paste toàn cục khi người dùng đang di chuột hoặc focus vào khung này.
   * Sử dụng { capture: true } để không bị các thẻ con chặn mất sự kiện.
   */
  useEffect(() => {
    if ((!isHovered && !isFocused) || disabled || isUploading) return;

    const onWindowPaste = (e: ClipboardEvent) => {
      const file = extractImageFromClipboard(e);
      if (file) {
        handlePaste(e);
      }
    };

    window.addEventListener('paste', onWindowPaste, { capture: true });
    return () => {
      window.removeEventListener('paste', onWindowPaste, { capture: true });
    };
  }, [isHovered, isFocused, disabled, isUploading, extractImageFromClipboard, handlePaste]);

  /**
   * Nút bấm 1-Click "Dán ảnh (Ctrl+V)": Đọc trực tiếp từ Clipboard API của trình duyệt.
   */
  const handlePasteFromClipboardClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;

    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File(
              [blob],
              `pasted-image-${Date.now()}.${imageType.split('/')[1] || 'png'}`,
              { type: imageType }
            );
            const validation = validateMediaFile(file);
            if (!validation.isValid) {
              setValidationError(validation.error || 'Tệp tin không hợp lệ');
              return;
            }
            setValidationError(null);
            setPasteSuccessToast(true);
            setTimeout(() => setPasteSuccessToast(false), 2000);
            onFileSelect(file);
            return;
          }
        }
      }
    } catch {
      // Nếu trình duyệt chưa cấp quyền clipboard, tự động focus khung để người dùng bấm Ctrl+V
    }

    // Fallback: Focus vào khung thả ảnh
    dropzoneRef.current?.focus();
    setIsFocused(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleClickZone = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !imageUrl) {
      e.preventDefault();
      handleClickZone();
    }
  };

  const aspectClass = aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        disabled={disabled || isUploading}
        aria-label={label}
      />

      {/* Upload Dropzone Container */}
      <div
        ref={dropzoneRef}
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        onClick={!imageUrl ? handleClickZone : undefined}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsDragOver(false);
        }}
        aria-disabled={disabled || isUploading}
        className={`relative w-full ${aspectClass} rounded-xl border transition-[border-color,background-color,box-shadow] flex flex-col items-center justify-center overflow-hidden outline-none ${
          imageUrl
            ? 'p-0 border-[#EAE6DF] bg-[#FAF8F5]'
            : isDragOver
              ? 'p-3 border-accent bg-accent/5 ring-2 ring-accent/30'
              : isHovered || isFocused
                ? 'p-3 border-dashed border-accent/70 bg-white ring-2 ring-accent/20 cursor-pointer'
                : 'p-3 border-dashed border-[#DDD7CD] bg-[#FAF8F5] hover:border-accent/60 hover:bg-white cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* State A: Image Uploaded (NO BLACK BORDER, warm #FAF8F5 canvas background) */}
        {imageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center group overflow-hidden bg-[#FAF8F5]">
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-contain"
              loading="lazy"
            />

            {/* Hover Overlay with Action Buttons */}
            <div className="absolute inset-0 bg-[#1C1917]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-white">
              <span className="text-xs font-semibold text-white/95 truncate max-w-full">
                {label}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickZone();
                  }}
                  disabled={disabled || isUploading}
                  className="px-3 py-1.5 rounded-lg bg-white text-[#1C1917] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FAF8F5] transition-[background-color,transform] shadow-xs cursor-pointer active:scale-95"
                  title="Thay hình ảnh khác"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Thay ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasteFromClipboardClick}
                  disabled={disabled || isUploading}
                  className="px-3 py-1.5 rounded-lg bg-white text-accent text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FAF8F5] transition-[background-color,transform] shadow-xs cursor-pointer active:scale-95"
                  title="Dán ảnh mới từ bộ nhớ tạm (Ctrl+V)"
                >
                  <Clipboard className="h-3 w-3" />
                  <span>Dán mới (Ctrl+V)</span>
                </button>

                {onRemoveImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage();
                    }}
                    disabled={disabled || isUploading}
                    className="px-3 py-1.5 rounded-lg bg-status-error-bg text-status-error-text text-xs font-semibold flex items-center gap-1.5 hover:bg-status-error-bg/90 transition-[background-color,transform] shadow-xs cursor-pointer active:scale-95"
                    title="Xóa hình ảnh này"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : isUploading ? (
          /* State B: Upload in Progress */
          <div className="flex flex-col items-center justify-center gap-2 text-center text-xs p-4">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <span className="font-semibold text-ink">Đang tải hình ảnh lên...</span>
            <span className="text-[11px] text-muted">Vui lòng đợi trong giây lát</span>
          </div>
        ) : (
          /* State C: Empty Dropzone with Dual Pick / Paste Actions */
          <div className="flex flex-col items-center justify-center gap-2 text-center p-3 select-none w-full">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-[background-color,border-color,color] shadow-2xs ${
                isHovered || isFocused
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'bg-white text-muted border border-[#E2DDD5]'
              }`}
            >
              {isDragOver ? (
                <UploadCloud className="h-5 w-5 text-accent" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-bold text-ink block">
                {isDragOver ? 'Thả hình ảnh vào đây' : label}
              </span>
              <p className="text-[11px] text-muted max-w-[260px] leading-tight mx-auto">
                {sublabel || 'Khung hình 16:9 (PNG, JPG, WebP tối đa 10MB)'}
              </p>
            </div>

            {/* Quick Action Buttons: Click file picker OR 1-Click Paste button */}
            <div
              className="flex items-center gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClickZone}
                disabled={disabled || isUploading}
                className="h-7 text-[11px] font-medium px-2.5 rounded-lg border-[#DDD7CD] bg-white hover:bg-[#FAF8F5] text-ink cursor-pointer transition-[background-color,border-color]"
              >
                <span>Chọn tệp</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteFromClipboardClick}
                disabled={disabled || isUploading}
                className={`h-7 text-[11px] font-medium px-2.5 rounded-lg cursor-pointer transition-[background-color,border-color,color] ${
                  isHovered || isFocused
                    ? 'border-accent/50 text-accent bg-accent/5 hover:bg-accent/10'
                    : 'border-[#DDD7CD] bg-white hover:bg-[#FAF8F5] text-ink'
                }`}
                title="Dán ảnh trực tiếp từ bộ nhớ tạm (Ctrl+V hoặc Cmd+V)"
              >
                <Clipboard className="h-3 w-3 mr-1" />
                <span>Dán ảnh (Ctrl+V)</span>
              </Button>
            </div>

            {(isHovered || isFocused) && (
              <span className="text-[10px] font-sans text-accent font-medium pt-0.5 animate-fadeIn">
                Đang sẵn sàng: Nhấn Ctrl+V để dán ảnh ngay
              </span>
            )}
          </div>
        )}
      </div>

      {/* Paste Success Toast Indicator */}
      {pasteSuccessToast && (
        <div className="rounded-lg border border-status-success-text/30 bg-status-success-bg p-2 text-[11px] text-status-success-text flex items-center gap-1.5 animate-fadeIn">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>Đã nhận diện ảnh từ bộ nhớ tạm và đang xử lý tải lên...</span>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-2 text-[11px] text-status-error-text flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
