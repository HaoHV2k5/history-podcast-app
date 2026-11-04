import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Plus, Trash2, CheckCircle2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SYSTEM_CORE_PERKS,
  MembershipTierConfig,
} from '../membershipLogic';

export interface AdminMembershipPlanConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPerks?: string[];
  onSaveSystemPerks?: (customPerks: string[]) => void;
  // Legacy compatibility props
  tier?: MembershipTierConfig | null;
  channels?: { id: number; name: string }[];
  onSave?: (tier: MembershipTierConfig, channelId?: number) => void;
}

const SUGGESTED_FUTURE_PERKS = [
  'Tải xuống âm thanh chất lượng cao (Lossless) nghe ngoại tuyến',
  'Tham gia phòng giao lưu hỏi đáp (Q&A) lịch sử định kỳ cùng Creator',
  'Nhận bản tin PDF tóm tắt niên biểu & sơ đồ trận đánh mỗi tập',
  'Ưu tiên yêu cầu chủ đề lịch sử mới trong hòm thư Hội viên',
];

export const AdminMembershipPlanConfigModal: React.FC<
  AdminMembershipPlanConfigModalProps
> = ({ isOpen, onClose, systemPerks = [], onSaveSystemPerks }) => {
  const [customPerks, setCustomPerks] = useState<string[]>([]);
  const [newPerk, setNewPerk] = useState('');
  const [perkError, setPerkError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const perksListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const extra = (systemPerks || []).filter(
        (p) => p && !SYSTEM_CORE_PERKS.includes(p.trim())
      );
      setCustomPerks(extra);
      setNewPerk('');
      setPerkError(null);
    }
  }, [systemPerks, isOpen]);

  if (!isOpen) return null;

  const allPerks = [...SYSTEM_CORE_PERKS, ...customPerks];

  const handleAddPerk = (perkToAdd?: string) => {
    const text = (perkToAdd !== undefined ? perkToAdd : newPerk).trim();

    if (!text) {
      setPerkError('Vui lòng nhập nội dung đặc quyền hệ thống vào ô bên dưới trước khi nhấn Thêm.');
      inputRef.current?.focus();
      return;
    }

    if (allPerks.some((p) => p.toLowerCase() === text.toLowerCase())) {
      setPerkError('Đặc quyền này đã tồn tại trong danh sách hệ thống.');
      inputRef.current?.focus();
      return;
    }

    setCustomPerks((prev) => [...prev, text]);
    setNewPerk('');
    setPerkError(null);

    setTimeout(() => {
      if (perksListRef.current) {
        perksListRef.current.scrollTo({
          top: perksListRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
      inputRef.current?.focus();
    }, 50);
  };

  const handleRemoveCustomPerk = (indexInCustom: number) => {
    setCustomPerks((prev) => prev.filter((_, i) => i !== indexInCustom));
    if (perkError) setPerkError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSystemPerks?.(customPerks);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-system-perks-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-[#F0EBE6] bg-[#FFFBF7] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] shrink-0">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 id="modal-system-perks-title" className="text-base font-bold text-[#1F1612]">
                  Cấu hình Đặc quyền Hội viên Toàn Hệ thống
                </h3>
                <p className="text-xs text-stone-500">
                  Quản lý danh sách quyền lợi chuẩn áp dụng chung cho mọi gói hội viên trên Sử Ký
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Architecture Notice Banner */}
          <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Cơ chế đồng bộ Đặc quyền Hệ thống (Admin &harr; Creator)</span>
            </div>
            <p className="text-[11.5px] text-stone-600 leading-relaxed">
              Mỗi kênh Creator tự thiết lập tên gói và mức giá hàng tháng, nhưng <strong>danh sách đặc quyền hội viên</strong> được chuẩn hóa chung trên toàn hệ thống. 3 đặc quyền cốt lõi được khóa cố định theo cơ chế kiểm soát của Backend; Admin có thể bổ sung thêm đặc quyền mới khi hệ thống nâng cấp tính năng.
            </p>
          </div>

          {/* Perks list configuration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1F1612]">
                Danh sách đặc quyền chuẩn của hệ thống ({allPerks.length})
              </label>
              <span className="text-[11px] font-medium text-stone-500">
                3 mặc định cốt lõi • {customPerks.length} mở rộng
              </span>
            </div>

            {/* List with auto scroll */}
            <div
              ref={perksListRef}
              className="max-h-56 overflow-y-auto space-y-2 pr-1 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/60 p-2.5"
            >
              {/* 1. Core Locked System Perks */}
              {SYSTEM_CORE_PERKS.map((perk, idx) => (
                <div
                  key={`core-${idx}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-white px-3 py-2.5 border border-[#EBE4D8] shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 className="h-4 w-4 text-[#991B1B] shrink-0" />
                    <span className="text-stone-800 font-semibold leading-snug break-words">
                      {perk}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] px-2 py-0.5 text-[10px] font-semibold text-stone-600 shrink-0">
                    <Lock className="h-2.5 w-2.5 text-[#991B1B]" />
                    Cố định hệ thống
                  </span>
                </div>
              ))}

              {/* 2. Additional System Perks configured by Admin */}
              {customPerks.map((perk, idx) => (
                <div
                  key={`custom-${idx}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-emerald-50/40 px-3 py-2.5 border border-emerald-200/80 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-stone-800 font-medium leading-snug break-words">
                      {perk}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-semibold">
                      Mở rộng
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomPerk(idx)}
                      className="text-stone-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label={`Xóa đặc quyền ${perk}`}
                      title="Xóa đặc quyền mở rộng này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new system perk input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-stone-600">
                Thêm đặc quyền hệ thống mới (khi Backend bổ sung tính năng mới)
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newPerk}
                  onChange={(e) => {
                    setNewPerk(e.target.value);
                    if (perkError) setPerkError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPerk();
                    }
                  }}
                  placeholder="Nhập tên đặc quyền mới dùng chung toàn hệ thống..."
                  className={`flex-1 h-9 px-3 rounded-xl border bg-white text-xs text-[#1F1612] focus:outline-none transition-colors ${
                    perkError
                      ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                      : 'border-[#E7E5E4] focus:border-[#991B1B]'
                  }`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPerk()}
                  className="h-9 px-3.5 text-xs rounded-xl border-[#991B1B]/30 text-[#991B1B] hover:bg-[#FEE2E2]/40 font-semibold shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Thêm quyền lợi</span>
                </Button>
              </div>

              {perkError && (
                <p className="text-[11px] text-red-600 font-medium pl-1">
                  {perkError}
                </p>
              )}

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-stone-400 font-medium">Gợi ý tính năng tương lai:</span>
                {SUGGESTED_FUTURE_PERKS.filter((s) => !allPerks.includes(s)).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddPerk(sug)}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-600 hover:border-[#991B1B]/40 hover:bg-[#FFF8F6] hover:text-[#991B1B] transition-colors cursor-pointer"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    <span className="truncate max-w-[230px]">{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0EBE6]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs rounded-xl border-[#E7E5E4] text-stone-600 hover:bg-stone-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 px-5 text-xs font-semibold rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-xs cursor-pointer"
            >
              Lưu đặc quyền hệ thống
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
