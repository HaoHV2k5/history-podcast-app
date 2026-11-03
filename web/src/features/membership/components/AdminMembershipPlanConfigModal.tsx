import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MembershipTierConfig } from '../membershipLogic';

export interface AdminMembershipPlanConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: MembershipTierConfig | null;
  channels?: { id: number; name: string }[];
  onSave: (tier: MembershipTierConfig, channelId?: number) => void;
}

export const AdminMembershipPlanConfigModal: React.FC<
  AdminMembershipPlanConfigModalProps
> = ({ isOpen, onClose, tier, channels, onSave }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(50000);
  const [badge, setBadge] = useState('CƠ BẢN');
  const [badgeType, setBadgeType] = useState<'basic' | 'popular' | 'vip'>('basic');
  const [perks, setPerks] = useState<string[]>([]);
  const [newPerk, setNewPerk] = useState('');
  const [perkError, setPerkError] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number>(channels?.[0]?.id ?? 6);

  const inputRef = useRef<HTMLInputElement>(null);
  const perksListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    if (tier) {
      setTitle(tier.title);
      setPrice(tier.price);
      setBadge(tier.badge);
      setBadgeType(tier.badgeType);
      setPerks([...tier.perks]);
      setNewPerk('');
      setPerkError(null);
    } else {
      setTitle('');
      setPrice(50000);
      setBadge('CƠ BẢN');
      setBadgeType('basic');
      setPerks([
        'Nghe podcast không quảng cáo',
        'Truy cập nội dung độc quyền',
        'Huy hiệu hội viên Sử Ký',
      ]);
      setNewPerk('');
      setPerkError(null);
    }
  }, [tier, isOpen]);

  if (!isOpen) return null;

  const handleAddPerk = (perkToAdd?: string) => {
    const text = (perkToAdd !== undefined ? perkToAdd : newPerk).trim();

    if (!text) {
      setPerkError('Vui lòng nhập nội dung đặc quyền vào ô bên cạnh trước khi nhấn Thêm.');
      inputRef.current?.focus();
      return;
    }

    if (perks.includes(text)) {
      setPerkError('Đặc quyền này đã có trong danh sách.');
      inputRef.current?.focus();
      return;
    }

    setPerks((prev) => [...prev, text]);
    setNewPerk('');
    setPerkError(null);

    // Auto-scroll list to bottom to view new perk
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

  const handleRemovePerk = (index: number) => {
    setPerks((prev) => prev.filter((_, i) => i !== index));
    if (perkError) setPerkError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedTier: MembershipTierConfig = {
      id: tier?.id || `tier-${Date.now()}`,
      badge,
      badgeType,
      title: title.trim(),
      price: Number(price) || 0,
      priceUnit: '/ tháng',
      subscriberCount: tier?.subscriberCount || 0,
      thumbnail:
        tier?.thumbnail ||
        (badgeType === 'vip'
          ? '/assets/studio/admin-membership-tier-vip.png'
          : badgeType === 'popular'
            ? '/assets/studio/admin-membership-tier-premium.png'
            : '/assets/studio/admin-membership-tier-standard.png'),
      perks,
    };

    onSave(updatedTier, selectedChannelId);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-plan-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-[#F0EBE6] bg-[#FFFBF7] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 id="modal-plan-title" className="text-base font-bold text-[#1F1612]">
                  {tier ? `Cấu hình ${tier.title}` : 'Thêm gói hội viên mới'}
                </h3>
                <p className="text-xs text-stone-500">
                  Thiết lập giá cước và các quyền lợi đặc quyền cho hội viên Sử Ký
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Channel selector if multiple channels are available in DB */}
          {channels && channels.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                Kênh Podcast áp dụng gói <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-[#E7E5E4] bg-white text-xs text-stone-700 font-medium focus:outline-none focus:border-[#991B1B]"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Kênh #{ch.id}: {ch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
              Tên gói hội viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hội Viên Thường, Hội Viên Cao Cấp..."
              className="w-full h-10 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs text-[#1F1612] focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                Mức giá (VNĐ / tháng) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs text-[#1F1612] font-mono focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                Nhãn phân loại
              </label>
              <select
                value={badgeType}
                onChange={(e) => {
                  const val = e.target.value as 'basic' | 'popular' | 'vip';
                  setBadgeType(val);
                  setBadge(val === 'popular' ? 'PHỔ BIẾN' : val === 'vip' ? 'VIP' : 'CƠ BẢN');
                }}
                className="w-full h-10 px-3 rounded-xl border border-[#E7E5E4] bg-white text-xs text-stone-700 font-medium focus:outline-none focus:border-[#991B1B]"
              >
                <option value="basic">CƠ BẢN (Đỏ nhạt)</option>
                <option value="popular">PHỔ BIẾN (Vàng kim)</option>
                <option value="vip">VIP (Tím hoàng gia)</option>
              </select>
            </div>
          </div>

          {/* Perks list configuration */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-stone-600">
                Danh sách đặc quyền ({perks.length})
              </label>
              {perks.length === 0 && (
                <span className="text-[11px] text-amber-600">Chưa có đặc quyền nào</span>
              )}
            </div>

            {/* List with auto scroll */}
            <div
              ref={perksListRef}
              className="space-y-1.5 max-h-36 overflow-y-auto pr-1"
            >
              {perks.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-2 text-stone-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{p}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePerk(idx)}
                    className="text-stone-400 hover:text-rose-600 transition-colors ml-2 cursor-pointer p-0.5"
                    aria-label={`Xóa đặc quyền ${p}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add perk input & action button */}
            <div className="space-y-1.5 pt-1">
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
                  placeholder="Nhập đặc quyền mới..."
                  className={`flex-1 h-9 px-3 rounded-lg border bg-white text-xs text-[#1F1612] focus:outline-none transition-colors ${
                    perkError
                      ? 'border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-[#E7E5E4] focus:border-[#991B1B]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleAddPerk()}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-semibold text-xs transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {perkError && (
                <p className="text-[11px] text-rose-600 font-medium animate-in fade-in duration-150">
                  {perkError}
                </p>
              )}

              {/* Quick suggestion chips */}
              <div className="pt-1">
                <p className="text-[10px] text-stone-400 mb-1">Gợi ý nhanh (nhấn để thêm ngay):</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Nghe podcast không quảng cáo',
                    'Truy cập nội dung độc quyền',
                    'Huy hiệu hội viên Sử Ký',
                    'Nghe trước tập mới 24h',
                    'Tham gia nhóm cộng đồng VIP',
                  ]
                    .filter((sug) => !perks.includes(sug))
                    .slice(0, 3)
                    .map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddPerk(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-[#FEE2E2] hover:text-[#991B1B] text-stone-600 transition-colors cursor-pointer border border-stone-200/60"
                      >
                        + {sug}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0EBE6]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#991B1B] hover:bg-[#831826] text-white text-xs px-4"
            >
              Lưu cấu hình
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
