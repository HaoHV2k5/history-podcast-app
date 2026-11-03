import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  ExternalLink,
  Lock,
  X,
  ScrollText,
  Volume2,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudioApiKeyOnboardingModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain?: boolean) => void;
  onOpenSettings: (dontShowAgain?: boolean) => void;
}

export const StudioApiKeyOnboardingModal: React.FC<StudioApiKeyOnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const rowGeminiRef = useRef<HTMLDivElement>(null);
  const rowElevenLabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // GSAP Entrance Animations
    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
    }

    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.96, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }

    if (rowGeminiRef.current && rowElevenLabsRef.current) {
      gsap.fromTo(
        [rowGeminiRef.current, rowElevenLabsRef.current],
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.08,
          delay: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      data-ui="modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 overflow-y-auto"
      onClick={() => onClose(dontShowAgain)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-onboarding-title"
    >
      <div
        ref={modalRef}
        data-ui="modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#DDD7CD] bg-[#FAF8F5] p-5 sm:p-7 my-auto text-[#1C1917]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onClose(dontShowAgain)}
          aria-label="Đóng thông báo"
          className="absolute top-4 right-4 p-2 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-stone-200/50 cursor-pointer transition-[color,background-color] duration-150"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Editorial Masthead */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-[#981B1E]" />
            <span className="text-xs font-medium text-[#78716C]">
              Phòng thu Sử Ký
            </span>
          </div>

          <h2
            id="api-onboarding-title"
            className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] leading-snug"
          >
            Cài đặt API Key để tạo nội dung
          </h2>

          <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
            Kết nối API Key để AI hỗ trợ bạn viết kịch bản lịch sử và lồng tiếng tự động.
          </p>
        </div>

        {/* Editorial Ledger Table */}
        <div className="mt-5 border border-[#E0D9CF] rounded-xl bg-white divide-y divide-[#EFEAE2] overflow-hidden">
          {/* Row 1: Google Gemini */}
          <div
            ref={rowGeminiRef}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-[background-color] duration-150"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <ScrollText className="h-4 w-4 text-[#981B1E] shrink-0" />
                <span className="font-serif font-bold text-sm sm:text-base text-[#1C1917]">
                  Google Gemini
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#981B1E]/10 text-[#981B1E] border border-[#981B1E]/20">
                  Bắt buộc
                </span>
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed pl-6">
                Tự động tra cứu lịch sử và viết kịch bản phân cảnh.
              </p>
            </div>

            <div className="sm:text-right shrink-0 pl-6 sm:pl-0">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#981B1E] hover:underline underline-offset-4 cursor-pointer"
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Row 2: ElevenLabs Voice */}
          <div
            ref={rowElevenLabsRef}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-[background-color] duration-150"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Volume2 className="h-4 w-4 text-[#57534E] shrink-0" />
                <span className="font-serif font-bold text-sm sm:text-base text-[#1C1917]">
                  ElevenLabs Voice
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F2EFE9] text-[#57534E] border border-[#DDD7CD]">
                  Tùy chọn
                </span>
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed pl-6">
                Lồng tiếng truyền cảm (mặc định có sẵn giọng đọc miễn phí).
              </p>
            </div>

            <div className="sm:text-right shrink-0 pl-6 sm:pl-0">
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#292524] hover:underline underline-offset-4 cursor-pointer"
              >
                <span>Nhận 10.000 ký tự</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Where to Configure & Security Reassurance */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#F5F1E9] border border-[#E5E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#57534E]">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="h-4 w-4 text-[#981B1E] shrink-0" />
            <span className="sm:whitespace-nowrap">
              Cấu hình tại mục <strong className="font-semibold text-[#1C1917]">Cài đặt API Key</strong> ở đầu phòng thu.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] shrink-0 whitespace-nowrap pl-6 sm:pl-0">
            <Lock className="h-3.5 w-3.5 text-[#8C827A]" />
            <span>Lưu an toàn trên máy bạn</span>
          </div>
        </div>

        {/* Checkbox: Do not show again & Action Controls */}
        <div className="mt-5 space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#57534E] hover:text-[#1C1917] transition-[color] duration-150">
              <input
                type="checkbox"
                id="dont-show-again-checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-[#C4BCB1] text-[#981B1E] focus:ring-[#981B1E]/20 cursor-pointer accent-[#981B1E]"
              />
              <span className="font-medium">
                Không hiển thị lại thông báo này
              </span>
            </label>
            {dontShowAgain && (
              <span className="text-[11px] text-[#8C827A] italic hidden sm:inline">
                Đã ghi nhớ lựa chọn
              </span>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EFEBE4]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onClose(dontShowAgain)}
              className="w-full sm:w-auto text-xs text-[#78716C] hover:text-[#1C1917] hover:bg-stone-200/40 cursor-pointer h-9 px-4 rounded-xl"
            >
              Để sau
            </Button>

            <Button
              type="button"
              size="default"
              onClick={() => onOpenSettings(dontShowAgain)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 h-9 rounded-xl bg-[#981B1E] text-white hover:bg-[#801619] cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.98]"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Mở Cài đặt API Key</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
