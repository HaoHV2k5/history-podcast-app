import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mic,
  Mail,
  Phone,
  Calendar,
  Globe,
  Volume2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AdminNarratorRow } from '../narratorsLogic';

export interface AdminNarratorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrator: AdminNarratorRow | null;
  onApprove: (row: AdminNarratorRow) => void;
  onReject: (row: AdminNarratorRow) => void;
  isProcessing?: boolean;
}

export const AdminNarratorDetailModal: React.FC<AdminNarratorDetailModalProps> = ({
  isOpen,
  onClose,
  narrator,
  onApprove,
  onReject,
  isProcessing = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !narrator) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-[#F0EBE6] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with Heritage Art Backdrop matching Sử Ký aesthetics */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#FAF8F5] via-[#FFF5F5] to-[#FAF8F5] p-5 sm:p-6 border-b border-[#F0EBE6]">
          {/* Background Panorama Illustration */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/3 opacity-30 select-none overflow-hidden"
            aria-hidden="true"
          >
            <img
              src="/assets/studio/admin-membership-hero-panorama-seamless.png"
              alt=""
              className="h-full w-full object-cover object-right"
            />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B]">
                <Mic className="h-4 w-4" />
                <span>Hồ sơ chi tiết Thuyết minh viên</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 leading-tight">
                {narrator.fullName}
              </h2>
              <p className="text-xs text-stone-500 font-sans">
                Xem toàn bộ thông tin tài khoản, hồ sơ giọng đọc demo và thẩm định xét duyệt.
              </p>
            </div>

            {/* Exactly ONE clean, rounded close button (Chống đè 2 nút dấu X) */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/90 border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-white hover:border-stone-300 transition-colors shadow-xs"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* User Profile Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#F0EBE6] bg-[#FAF8F5] p-4">
            <div className="flex items-center gap-3.5">
              {narrator.avatarUrl ? (
                <img
                  src={narrator.avatarUrl}
                  alt={narrator.fullName}
                  className="h-14 w-14 shrink-0 rounded-full object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFF0F2] border-2 border-white shadow-xs text-base font-bold text-[#991B1B]">
                  {narrator.initials}
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-base">{narrator.fullName}</span>
                  <span className="font-mono text-xs text-stone-400 tabular-nums">#{narrator.userId}</span>
                </div>
                <p className="text-xs text-stone-500 italic max-w-md line-clamp-2">
                  &ldquo;{narrator.bio}&rdquo;
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span
                style={{
                  backgroundColor: narrator.statusConfig.bg,
                  borderColor: narrator.statusConfig.border,
                  color: narrator.statusConfig.text,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${narrator.statusConfig.dot}`} />
                <span>{narrator.statusConfig.label}</span>
              </span>
            </div>
          </div>

          {/* Contact & Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-stone-400 block">Địa chỉ email</span>
                <span className="text-xs font-semibold text-stone-800 truncate block">{narrator.email}</span>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-stone-400 block">Số điện thoại</span>
                <span className="text-xs font-semibold font-mono text-stone-800 tabular-nums truncate block">
                  {narrator.phone}
                </span>
              </div>
            </div>

            {/* Language & Voice */}
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-stone-400 block">Ngôn ngữ & Giọng đọc</span>
                <span className="text-xs font-semibold text-stone-800 truncate block">
                  {narrator.languageFlag} {narrator.languageLabel} • {narrator.voiceGenderLabel}
                </span>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-stone-400 block">Ngày nộp hồ sơ</span>
                <span className="text-xs font-semibold font-mono text-stone-800 tabular-nums truncate block">
                  {narrator.dateStr} {narrator.timeStr}
                </span>
              </div>
            </div>
          </div>

          {/* Audio Demos Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-[#991B1B]" />
                <span>Tệp ghi âm demo đã tải lên ({narrator.demos.length})</span>
              </span>
            </div>

            {narrator.demos.length > 0 ? (
              <div className="space-y-2.5">
                {narrator.demos.map((demo) => (
                  <div
                    key={demo.id}
                    className="rounded-xl border border-[#F0EBE6] bg-[#FAF8F5] p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-stone-800 truncate">
                        {demo.title || `Bản thu demo #${demo.id}`}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono tabular-nums">
                        {demo.uploadedAt ? new Date(demo.uploadedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </span>
                    </div>

                    <audio controls className="w-full h-8" preload="metadata">
                      <source src={demo.fileUrl} type="audio/mpeg" />
                      Trình duyệt không hỗ trợ phát âm thanh trực tiếp.
                    </audio>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-stone-400 space-y-1">
                <Volume2 className="h-6 w-6 mx-auto stroke-[1.5]" />
                <p className="text-xs font-medium text-stone-600">Thuyết minh viên chưa tải lên tệp demo giọng đọc</p>
                <p className="text-[11px] text-stone-400">
                  Hệ thống yêu cầu ít nhất 1 bản thu thử để hoàn tất quy trình thẩm định.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Modal Footer with Actions */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-5 py-4">
          <div className="flex items-center gap-2">
            {narrator.status !== 'APPROVED' && (
              <button
                type="button"
                onClick={() => onApprove(narrator)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Phê duyệt hồ sơ</span>
              </button>
            )}

            {narrator.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => onReject(narrator)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Từ chối hồ sơ</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#991B1B] text-white text-xs font-semibold hover:bg-[#7F1D1D] transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
