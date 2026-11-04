import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Check,
  Save,
  Loader2,
  Info,
  Lock,
  Edit3,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { MembershipPlanItem, MembershipPlanRequest } from '@/types/membership';
import { formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface ChannelMembershipPlanCardProps {
  currentPlan?: MembershipPlanItem | null;
  onSubmit: (payload: MembershipPlanRequest) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const SYSTEM_DEFAULT_PERKS = [
  'Nghe sớm các tập Podcast Hội viên (Early Access)',
  'Xem toàn bộ kho nội dung độc quyền (Members-Only)',
  'Huy hiệu Hội viên VIP nổi bật trong phòng Livestream & Bình luận',
];

export const ChannelMembershipPlanCard: React.FC<ChannelMembershipPlanCardProps> = ({
  currentPlan,
  onSubmit,
  isSubmitting = false,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(50000);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with currentPlan when data loads
  useEffect(() => {
    if (currentPlan) {
      setName(currentPlan.name || '');
      setPrice(currentPlan.monthlyPrice || 50000);
      setDescription(currentPlan.description || '');
      setStatus((currentPlan.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
    }
  }, [currentPlan]);

  const handleCancelEdit = () => {
    setErrorMessage(null);
    if (currentPlan) {
      setName(currentPlan.name || '');
      setPrice(currentPlan.monthlyPrice || 50000);
      setDescription(currentPlan.description || '');
      setStatus((currentPlan.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
    }
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Tên gói hội viên không được để trống.');
      return;
    }

    if (price < 10000 || price > 5000000) {
      setErrorMessage('Mức giá gói hội viên phải nằm trong khoảng 10.000 VNĐ – 5.000.000 VNĐ / tháng.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      monthlyPrice: price,
      perks: SYSTEM_DEFAULT_PERKS,
      status,
    });
    setIsEditing(false);
  };

  const hasConfiguredPlan = Boolean(currentPlan && currentPlan.name);
  const isPlanActive = (currentPlan?.status || status) === 'ACTIVE';
  const displayPrice = currentPlan?.monthlyPrice || price || 50000;
  const creatorNetShare = Math.round(displayPrice * 0.9);
  const platformFeeShare = displayPrice - creatorNetShare;

  return (
    <article
      aria-label="Cấu hình Gói Hội Viên VIP"
      className={cn(
        'relative rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-5',
        className
      )}
      data-motion-target="membership"
    >
      {/* Header with Title and Action / Notice */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#F0EBE1] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FDF2F2] text-[#A31D24]"
              aria-hidden="true"
            >
              <Crown className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19]">
              Gói Hội Viên VIP của Kênh
            </h3>
            {hasConfiguredPlan && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                  isPlanActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isPlanActive ? 'bg-emerald-500' : 'bg-stone-400'
                  )}
                />
                {isPlanActive ? 'Đang mở đăng ký' : 'Đang tạm dừng'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-[13px] text-[#786D66] leading-relaxed">
            Thiết lập mức phí hàng tháng cho cộng đồng thính giả VIP. 3 đặc quyền cốt lõi được hệ thống tự động mở khóa và kiểm soát.
          </p>
        </div>

        {hasConfiguredPlan && !isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] hover:bg-[#F3EFE6] hover:border-[#D6CEBF] px-4 py-2 text-xs font-semibold text-[#1F1A19] transition-all cursor-pointer active:scale-[0.98] shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#A31D24]" />
            <span>Chỉnh sửa cấu hình gói</span>
          </button>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl bg-[#FFF8EB] border border-[#FDE68A] px-3.5 py-2 text-xs text-[#92400E] shadow-2xs max-w-md shrink-0"
            role="note"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white">
              <Sparkles className="h-3 w-3" />
            </div>
            <span className="leading-snug font-medium">
              Creator nhận <strong>90% doanh thu</strong> tự động về Ví khả dụng ngay khi thính giả đăng ký.
            </span>
          </div>
        )}
      </div>

      {/* ─── VIEW 1: CONFIGURED MEMBERSHIP PLAN SUMMARY CARD ─── */}
      {hasConfiguredPlan && !isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 7 Cols: Plan Identity & Description */}
            <div className="lg:col-span-7 rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5]/70 p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A31D24]">
                    Gói Hội Viên Hiện Hành
                  </span>
                  <span className="text-[11px] font-mono text-[#786D66]">
                    Chu kỳ: 30 ngày / lượt đăng ký
                  </span>
                </div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1F1A19] leading-snug">
                  {currentPlan?.name}
                </h4>
                <p className="text-xs sm:text-[13px] text-[#5C524C] leading-relaxed">
                  {currentPlan?.description ||
                    'Gói đặc quyền dành riêng cho thính giả yêu lịch sử của kênh: Nghe sớm các tập mới và mở khóa toàn bộ kho tư liệu độc quyền.'}
                </p>
              </div>

              {/* Locked 3 System Perks */}
              <div className="space-y-2 pt-3 border-t border-[#EBE4D8]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#1F1A19] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#A31D24]" />
                    <span>3 Đặc quyền hội viên được hệ thống bảo chứng</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E5E0D8] px-2 py-0.5 text-[10px] font-semibold text-[#786D66]">
                    <Lock className="h-2.5 w-2.5 text-[#A31D24]" />
                    Cố định theo hệ thống
                  </span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  {SYSTEM_DEFAULT_PERKS.map((perk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-xl bg-white border border-[#EBE4D8] px-3 py-2 text-xs text-[#1F1A19] font-medium"
                    >
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A31D24] text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Pricing & Revenue Breakdown */}
            <div className="lg:col-span-5 rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#786D66]">
                    Mức giá niêm yết trên Kênh
                  </span>
                  <Wallet className="h-4 w-4 text-[#A31D24]" />
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#A31D24]">
                    {formatVND(displayPrice)}
                  </span>
                  <span className="text-xs font-medium text-[#786D66]">/ tháng (30 ngày)</span>
                </div>

                <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5C524C]">Doanh thu Creator thực nhận (90%)</span>
                    <strong className="font-mono tabular-nums text-emerald-700">
                      +{formatVND(creatorNetShare)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#EBE4D8] pt-1.5">
                    <span className="text-[#786D66]">Phí vận hành nền tảng (10%)</span>
                    <span className="font-mono tabular-nums text-[#786D66]">
                      {formatVND(platformFeeShare)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                <p className="text-[11px] text-[#786D66] leading-relaxed">
                  {isPlanActive
                    ? '• Gói hội viên đang hiển thị công khai trên Trang Kênh (Web & Mobile App).'
                    : '• Gói đang tạm dừng nhận đăng ký mới. Các hội viên hiện tại vẫn giữ nguyên quyền lợi đến hết chu kỳ.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── VIEW 2: EDIT / CONFIGURE MEMBERSHIP PLAN FORM ─── */
        <>
          {errorMessage && (
            <div className="rounded-lg p-3 bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-xs flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                  placeholder="Ví dụ: Hội Viên VIP - Sử Việt Hào Khí"
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
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold tabular-nums">
                    Thực nhận 90%: {formatVND(Math.round((price || 0) * 0.9))}
                  </span>
                </div>
                <input
                  id="plan-price-input"
                  type="number"
                  min={10000}
                  max={5000000}
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

            {/* Row 3: Locked System Perks (Read-Only) */}
            <div className="space-y-2 rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#1F1A19] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#A31D24]" />
                  <span>3 Đặc quyền chuẩn của Hệ thống (Cố định — Không chỉnh sửa)</span>
                </span>
                <span className="text-[11px] text-[#786D66]">
                  Tự động kiểm soát quyền truy cập bởi Backend
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {SYSTEM_DEFAULT_PERKS.map((perk, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 rounded-lg bg-white border border-[#E5E0D8] px-3 py-2 text-xs text-[#38302E] font-medium"
                  >
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A31D24] text-white"
                      aria-hidden="true"
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Status Toggle & Save / Cancel Actions */}
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {hasConfiguredPlan && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#5C524C] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                )}

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
                  <span>Lưu cấu hình gói</span>
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </article>
  );
};
