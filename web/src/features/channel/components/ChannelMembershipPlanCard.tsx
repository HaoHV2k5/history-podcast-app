import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Plus, X, Save, Loader2, Info } from 'lucide-react';
import { MembershipPlanItem, MembershipPlanRequest } from '@/types/membership';
import { cn } from '@/utils/cn';

interface ChannelMembershipPlanCardProps {
  currentPlan?: MembershipPlanItem | null;
  onSubmit: (payload: MembershipPlanRequest) => void;
  isSubmitting?: boolean;
  className?: string;
}

const DEFAULT_PERKS = [
  'Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên (VIP)',
  'Nghe không giới hạn các nội dung chuyên sâu và độc quyền của kênh',
  'Tham gia phòng phát sóng trực tiếp độc quyền (Livestream VIP)',
];

export const ChannelMembershipPlanCard: React.FC<ChannelMembershipPlanCardProps> = ({
  currentPlan,
  onSubmit,
  isSubmitting = false,
  className,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(50000);
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState<string[]>(DEFAULT_PERKS);
  const [newPerkInput, setNewPerkInput] = useState('');
  const [isAddingPerk, setIsAddingPerk] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with currentPlan when data loads
  useEffect(() => {
    if (currentPlan) {
      setName(currentPlan.name || '');
      setPrice(currentPlan.monthlyPrice || 50000);
      setDescription(currentPlan.description || '');
      if (Array.isArray(currentPlan.perks) && currentPlan.perks.length > 0) {
        setPerks(currentPlan.perks);
      }
      setStatus((currentPlan.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
    }
  }, [currentPlan]);

  const handleAddPerk = () => {
    const trimmed = newPerkInput.trim();
    if (trimmed && !perks.includes(trimmed)) {
      setPerks((prev) => [...prev, trimmed]);
      setNewPerkInput('');
      setIsAddingPerk(false);
    }
  };

  const handleRemovePerk = (indexToRemove: number) => {
    setPerks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Tên gói hội viên không được để trống.');
      return;
    }

    if (price < 1000) {
      setErrorMessage('Mức giá tháng tối thiểu là 1.000 VNĐ.');
      return;
    }

    const cleanedPerks = perks.map((p) => p.trim()).filter(Boolean);

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      monthlyPrice: price,
      perks: cleanedPerks.length > 0 ? cleanedPerks : undefined,
      status,
    });
  };

  return (
    <article
      aria-label="Cấu hình Gói Hội Viên VIP"
      className={cn(
        'relative rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-6',
        className
      )}
      data-motion-target="membership"
    >
      {/* Header with Title and Amber Callout Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#F0EBE1] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FDF2F2] text-[#A31D24]"
              aria-hidden="true"
            >
              <Crown className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19]">
              Cấu hình Gói Hội Viên VIP của Kênh
            </h3>
          </div>
          <p className="text-xs sm:text-[13px] text-[#786D66] leading-relaxed">
            Thiết lập tên gói, mức giá tháng và các đặc quyền dành riêng cho thính giả trung thành.
          </p>
        </div>

        {/* Amber Benefit Notice Banner */}
        <div
          className="flex items-center gap-2 rounded-xl bg-[#FFF8EB] border border-[#FDE68A] px-3.5 py-2 text-xs text-[#92400E] shadow-2xs max-w-md shrink-0"
          role="note"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="leading-snug font-medium">
            Gói hội viên giúp bạn tạo nguồn thu bền vững và xây dựng cộng đồng thính giả trung thành.
          </span>
        </div>
      </div>

      {/* Validation Error Feedback */}
      {errorMessage && (
        <div className="rounded-lg p-3 bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-xs flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Plan Name & Monthly Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="plan-name-input" className="text-xs font-semibold text-[#1F1A19]">
                Tên gói hội viên <span className="text-[#A31D24]">*</span>
              </label>
              <span className="text-[10px] text-[#786D66] font-mono tabular-nums">
                {name.length}/100
              </span>
            </div>
            <input
              id="plan-name-input"
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Hội Viên Sử Việt Hào Khí"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs sm:text-sm font-medium text-[#1F1A19] bg-white placeholder:text-[#A89F97] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
            />
          </div>

          {/* Monthly Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="plan-price-input" className="text-xs font-semibold text-[#1F1A19]">
                Mức giá hàng tháng (VNĐ) <span className="text-[#A31D24]">*</span>
              </label>
              <span className="text-[10px] text-[#786D66]">
                Tối thiểu 1.000 VNĐ
              </span>
            </div>
            <input
              id="plan-price-input"
              type="number"
              min={1000}
              step={5000}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs sm:text-sm font-medium font-mono tabular-nums text-[#1F1A19] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
            />
          </div>
        </div>

        {/* Row 2: Plan Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="plan-desc-input" className="text-xs font-semibold text-[#1F1A19]">
              Mô tả gói
            </label>
            <span className="text-[10px] text-[#786D66] font-mono tabular-nums">
              {description.length}/1000
            </span>
          </div>
          <textarea
            id="plan-desc-input"
            rows={2}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Giới thiệu mục tiêu của gói hội viên và lời cảm ơn đến thính giả..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs sm:text-sm font-medium text-[#1F1A19] bg-white placeholder:text-[#A89F97] leading-relaxed transition-all resize-y focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
          />
        </div>

        {/* Row 3: Perks List & Add Perk Action */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#1F1A19] block">
            Danh sách đặc quyền (Mỗi dòng một đặc quyền)
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {perks.map((perk, index) => (
              <div
                key={index}
                className="group inline-flex items-center gap-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] px-3 py-1.5 text-xs text-[#38302E] font-medium shadow-2xs hover:border-[#D6CEBF] transition-all"
              >
                <div
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#A31D24] text-white"
                  aria-hidden="true"
                >
                  <Check className="h-2 w-2 stroke-[3]" />
                </div>
                <span>{perk}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePerk(index)}
                  title="Xóa đặc quyền này"
                  aria-label={`Xóa đặc quyền ${perk}`}
                  className="opacity-0 group-hover:opacity-100 hover:text-[#DC2626] transition-opacity ml-0.5 cursor-pointer focus-visible:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Quick Add Perk Trigger / Input */}
            {isAddingPerk ? (
              <div className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  value={newPerkInput}
                  onChange={(e) => setNewPerkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPerk();
                    } else if (e.key === 'Escape') {
                      setIsAddingPerk(false);
                      setNewPerkInput('');
                    }
                  }}
                  placeholder="Nhập tên đặc quyền..."
                  autoFocus
                  className="px-2.5 py-1 text-xs rounded-lg border border-[#A31D24] bg-white text-[#1F1A19] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPerk}
                  className="px-2 py-1 text-xs rounded-md bg-[#A31D24] text-white font-semibold cursor-pointer active:scale-95"
                >
                  Thêm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPerk(false);
                    setNewPerkInput('');
                  }}
                  className="p-1 text-[#8C827A] hover:text-[#1F1A19]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingPerk(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#A31D24] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#85171D] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm đặc quyền</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 4: Status Toggle & Save Action */}
        <div className="pt-3 border-t border-[#F0EBE1] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Status Segmented Buttons */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#1F1A19] mr-1">
                Trạng thái gói
              </span>

              <button
                type="button"
                onClick={() => setStatus('ACTIVE')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                  status === 'ACTIVE'
                    ? 'bg-[#A31D24] text-white shadow-2xs'
                    : 'bg-white border border-[#E5E0D8] text-[#5C524C] hover:bg-[#FAF8F5]'
                )}
              >
                Kích hoạt (ACTIVE)
              </button>

              <button
                type="button"
                onClick={() => setStatus('INACTIVE')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                  status === 'INACTIVE'
                    ? 'bg-[#A31D24] text-white shadow-2xs'
                    : 'bg-white border border-[#E5E0D8] text-[#5C524C] hover:bg-[#FAF8F5]'
                )}
              >
                Tạm dừng (INACTIVE)
              </button>
            </div>
            <p className="text-[11px] text-[#786D66]">
              {status === 'ACTIVE'
                ? '• Đang mở công khai: Thính giả có thể đăng ký gói trên ứng dụng và web.'
                : '• Đang tạm dừng: Kênh tạm đóng đăng ký mới, thính giả không thể mua gói.'}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[#85171D] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24] focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Save className="h-4 w-4 text-white" />
            )}
            <span>Lưu gói hội viên</span>
          </button>
        </div>
      </form>
    </article>
  );
};
