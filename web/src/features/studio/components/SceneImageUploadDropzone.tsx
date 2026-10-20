/**
 * SceneImageUploadDropzone Component
 * PRM232 - Sử Ký History Podcast Platform
 *
 * Provides a dedicated, accessible drag-and-drop image upload zone for:
 * 1. Whiteboard animation individual scene images (16:9).
 * 2. Audio Podcast cover art (1:1 / 16:9).
 *
 * Includes:
 * - Drag and drop file handling
 * - File picker fallback
 * - Client-side validation (size & format)
 * - Thumbnail preview
 * - Replace and remove actions
 * - Keyboard accessibility
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          // Reset so the same file name can be re-selected if desired
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        disabled={disabled || isUploading}
        aria-label={label}
      />

      {/* Upload Dropzone Container */}
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        onClick={!imageUrl ? handleClickZone : undefined}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-disabled={disabled || isUploading}
        className={`relative w-full ${aspectClass} rounded-xl border-2 transition-all flex flex-col items-center justify-center p-3 overflow-hidden ${
          imageUrl
            ? 'border-border bg-black/95'
            : isDragOver
              ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
              : 'border-dashed border-border bg-surface-subtle hover:border-accent/60 hover:bg-surface cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* State A: Image Uploaded */}
        {imageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center group">
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-contain rounded-lg"
              loading="lazy"
            />

            {/* Hover Overlay with Action Buttons */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-white">
              <span className="text-xs font-medium text-white/90 truncate max-w-full">
                {label}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickZone();
                  }}
                  disabled={disabled || isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-surface text-ink text-[11px] font-medium flex items-center gap-1.5 hover:bg-surface-subtle transition-colors shadow-xs"
                  title="Thay hình ảnh khác"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Thay ảnh</span>
                </button>

                {onRemoveImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage();
                    }}
                    disabled={disabled || isUploading}
                    className="px-2.5 py-1.5 rounded-lg bg-status-error-bg text-status-error-text text-[11px] font-medium flex items-center gap-1.5 hover:bg-status-error-bg/80 transition-colors shadow-xs"
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
            <span className="font-medium text-ink">Đang tải ảnh lên Cloudinary...</span>
            <span className="text-[11px] text-muted">Vui lòng đợi trong giây lát</span>
          </div>
        ) : (
          /* State C: Empty Dropzone */
          <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3 select-none">
            <div className="h-9 w-9 rounded-full bg-surface flex items-center justify-center text-muted border border-border shadow-2xs mb-1">
              {isDragOver ? (
                <UploadCloud className="h-5 w-5 text-accent animate-bounce" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted" />
              )}
            </div>
            <span className="text-xs font-semibold text-ink">
              {isDragOver ? 'Thả hình ảnh vào đây' : label}
            </span>
            <p className="text-[11px] text-muted max-w-[220px] leading-tight">
              {sublabel || 'Kéo & thả ảnh hoặc nhấp để chọn tệp (PNG, JPG, WebP tối đa 10MB)'}
            </p>
          </div>
        )}
      </div>

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
