import React, { useState } from 'react';
import {
  Eye,
  MoreVertical,
  Mail,
  Phone,
  MessageSquare,
  CreditCard,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { KycProfile } from '../../../types/kyc';
import {
  getInitials,
  getAvatarColor,
  getVerificationMethodBadge,
  getKycStatusBadgeConfig,
  formatKycDateTime,
  formatPhoneSpaced,
} from '../kycLogic';
import { cn } from '@/utils/cn';

interface AdminKycTableProps {
  items: KycProfile[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onViewDetail: (item: KycProfile) => void;
  onQuickApprove?: (item: KycProfile) => void;
  onQuickReject?: (item: KycProfile) => void;
  onNavigateWorkbench?: (id: number) => void;
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const AdminKycTable: React.FC<AdminKycTableProps> = ({
  items,
  totalElements,
  totalPages,
  page,
  size,
  onPageChange,
  onSizeChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetail,
  onQuickApprove,
  onQuickReject,
  onNavigateWorkbench,
  isLoading,
  onResetFilters,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const allCurrentSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const someCurrentSelected =
    items.some((item) => selectedIds.includes(item.id)) && !allCurrentSelected;

  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    setActiveMenuId(null);
  };

  const fromIndex = totalElements === 0 ? 0 : page * size + 1;
  const toIndex = Math.min((page + 1) * size, totalElements);

  return (
    <div className="relative rounded-2xl border border-[#EBE4D8] bg-white shadow-2xs overflow-hidden select-none">
      {/* 1. Main Table Container matching Mockup */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-[#EBE4D8] bg-[#FAF8F5]/90 text-[11px] sm:text-xs font-semibold text-[#57534E]">
              {/* Checkbox column */}
              <th scope="col" className="w-12 py-3.5 pl-4 sm:pl-5 pr-2">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả hồ sơ trên trang này"
                  checked={allCurrentSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someCurrentSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-[#991B1B] focus:ring-[#991B1B] transition-colors cursor-pointer"
                />
              </th>

              {/* Columns */}
              <th scope="col" className="py-3.5 px-3 min-w-[200px]">
                Người dùng
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[220px]">
                Thông tin liên hệ
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[160px]">
                Phương thức xác thực
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[130px]">
                Trạng thái KYC
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[140px]">
                Ngày nộp
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-4 sm:pr-5 text-right min-w-[140px]">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F5F1EB] text-xs">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: size }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 pl-4 sm:pl-5 pr-2">
                    <div className="h-4 w-4 rounded bg-[#E5E7EB]" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#E5E7EB]" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 rounded bg-[#E5E7EB]" />
                        <div className="h-2.5 w-16 rounded bg-[#F3F4F6]" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 space-y-1.5">
                    <div className="h-3 w-36 rounded bg-[#E5E7EB]" />
                    <div className="h-2.5 w-24 rounded bg-[#F3F4F6]" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-5 w-24 rounded bg-[#E5E7EB]" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-6 w-24 rounded-full bg-[#E5E7EB]" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                  </td>
                  <td className="py-4 pl-3 pr-4 sm:pr-5 text-right">
                    <div className="h-8 w-24 rounded bg-[#E5E7EB] ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#991B1B]">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-base font-bold text-[#1C1917]">
                        Không có hồ sơ xác thực nào
                      </h3>
                      <p className="text-xs text-[#78716C] leading-relaxed">
                        Không tìm thấy hồ sơ KYC nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.
                      </p>
                    </div>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1C1917] shadow-2xs hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Real Live Data Rows
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const initials = getInitials(item.fullName || item.userEmail);
                const palette = getAvatarColor(item.fullName || item.userEmail);
                const methodBadge = getVerificationMethodBadge(item.verificationMethod);
                const statusBadge = getKycStatusBadgeConfig(item.status);
                const isMenuOpen = activeMenuId === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onViewDetail(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onViewDetail(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Xem chi tiết hồ sơ xác thực KYC của ${item.fullName || item.userEmail}`}
                    className={cn(
                      'group transition-colors duration-150 hover:bg-[#FAF8F5]/90 select-none cursor-pointer focus:outline-none focus:bg-[#FAF7F2]',
                      isSelected ? 'bg-[#FEF2F2]/40' : ''
                    )}
                  >
                    {/* Checkbox Column */}
                    <td
                      className="py-4 pl-4 sm:pl-5 pr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Chọn hồ sơ ${item.fullName || item.userEmail}`}
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelect(item.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-[#D1D5DB] text-[#991B1B] focus:ring-[#991B1B] transition-colors cursor-pointer"
                      />
                    </td>

                    {/* Column 1: Người dùng matching Mockup */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs border shadow-2xs select-none',
                            palette.bg,
                            palette.text,
                            palette.border
                          )}
                        >
                          {initials}
                        </div>

                        {/* Name & User ID */}
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-semibold text-sm text-[#111827] group-hover:text-[#991B1B] transition-colors text-left truncate leading-tight"
                            title={item.fullName || 'Chưa cập nhật tên'}
                          >
                            {item.fullName || 'Chưa cập nhật tên'}
                          </span>
                          <span className="text-xs text-[#6B7280] font-normal mt-0.5">
                            User ID: #{String(item.userId).padStart(3, '0')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Thông tin liên hệ matching Mockup */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col space-y-1 text-xs text-[#374151]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-4 w-4 text-[#6B7280] shrink-0" strokeWidth={1.8} />
                          <span
                            className="truncate max-w-[200px]"
                            title={item.contactEmail || item.userEmail}
                          >
                            {item.contactEmail || item.userEmail}
                          </span>
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-2 text-[#374151]">
                            <Phone className="h-4 w-4 text-[#6B7280] shrink-0" strokeWidth={1.8} />
                            <span>{formatPhoneSpaced(item.phone)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 3: Phương thức xác thực matching Mockup */}
                    <td className="py-4 px-3">
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1F2937]">
                        {methodBadge.type === 'phone' ? (
                          <MessageSquare className="h-4 w-4 text-[#0284C7] shrink-0" strokeWidth={1.8} />
                        ) : methodBadge.type === 'cccd' ? (
                          <CreditCard className="h-4 w-4 text-[#0284C7] shrink-0" strokeWidth={1.8} />
                        ) : methodBadge.type === 'passport' ? (
                          <BookOpen className="h-4 w-4 text-[#0284C7] shrink-0" strokeWidth={1.8} />
                        ) : (
                          <Mail className="h-4 w-4 text-[#0284C7] shrink-0" strokeWidth={1.8} />
                        )}
                        <span>{methodBadge.label}</span>
                      </div>
                    </td>

                    {/* Column 4: Trạng thái KYC matching Mockup */}
                    <td className="py-4 px-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                          statusBadge.bgColor,
                          statusBadge.textColor,
                          statusBadge.borderColor
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusBadge.dotColor)} />
                        <span>{statusBadge.label}</span>
                      </span>
                    </td>

                    {/* Column 5: Ngày nộp matching Mockup */}
                    <td className="py-4 px-3">
                      <span className="text-xs text-[#4B5563] font-normal">
                        {formatKycDateTime(item.createdAt)}
                      </span>
                    </td>

                    {/* Column 6: Thao tác matching Mockup */}
                    <td
                      className="py-4 pl-3 pr-4 sm:pr-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-flex items-center justify-end gap-1.5">
                        {/* 1. Primary Action: Xem chi tiết */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(item);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#111827] shadow-2xs hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.8} />
                          <span>Xem chi tiết</span>
                        </button>

                        {/* 2. Secondary Action: 3-dots dropdown menu */}
                        <div className="relative">
                          <button
                            type="button"
                            aria-label={`Thao tác khác cho hồ sơ ${item.fullName || item.userEmail}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : item.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] hover:border-[#D1D5DB] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Dropdown Popover */}
                          {isMenuOpen && (
                            <>
                              {/* Backdrop click to close */}
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuId(null)}
                              />

                              <div className="absolute right-0 top-full mt-1 z-40 w-52 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg text-left text-xs animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onViewDetail(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#1C1917] hover:bg-[#FAF8F5] cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-[#57534E]" />
                                  <span>Xem chi tiết hồ sơ</span>
                                </button>

                                {onNavigateWorkbench && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onNavigateWorkbench(item.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#1C1917] hover:bg-[#FAF8F5] hover:text-[#991B1B] transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-[#991B1B]" strokeWidth={1.8} />
                                    <span>Mở bàn làm việc</span>
                                  </button>
                                )}

                                {item.status === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onQuickApprove?.(item);
                                        setActiveMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#059669] hover:bg-[#ECFDF5] cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                                      <span>Phê duyệt hồ sơ</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onQuickReject?.(item);
                                        setActiveMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                                    >
                                      <XCircle className="h-3.5 w-3.5 text-[#DC2626]" />
                                      <span>Từ chối hồ sơ</span>
                                    </button>
                                  </>
                                )}

                                <div className="my-1 border-t border-[#F3F4F6]" />

                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleCopy(
                                      item.contactEmail || item.userEmail,
                                      'email',
                                      e
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[#57534E] hover:bg-[#FAF8F5] cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5 text-[#78716C]" />
                                  <span>Sao chép email</span>
                                </button>

                                {item.phone && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleCopy(item.phone || '', 'phone', e)
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[#57534E] hover:bg-[#FAF8F5] cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-[#78716C]" />
                                    <span>Sao chép SĐT</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Copied Feedback Toast */}
      {copiedText && (
        <div className="absolute bottom-16 right-6 z-50 rounded-xl bg-[#1C1917] px-3.5 py-2 text-xs font-semibold text-white shadow-lg animate-in fade-in duration-150">
          Đã sao chép {copiedText} vào bộ nhớ tạm
        </div>
      )}

      {/* 2. Pagination Bar Footer matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#EBE4D8] bg-[#FAF8F5]/80 px-4 sm:px-6 py-3.5 select-none">
        {/* Left: Hiển thị 1–6 trong tổng số 24 hồ sơ */}
        <div className="text-xs text-[#6B7280]">
          <span>Hiển thị </span>
          <span className="font-semibold text-[#111827]">
            {fromIndex}–{toIndex}
          </span>
          <span> trong tổng số </span>
          <span className="font-semibold text-[#111827]">{totalElements}</span>
          <span> hồ sơ</span>
        </div>

        {/* Right: Rows per page selector + Page navigation buttons */}
        <div className="flex items-center gap-3">
          {/* Rows per page selector */}
          <div className="relative">
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              aria-label="Số hồ sơ trên mỗi trang"
              className="h-8 appearance-none rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-7 text-xs font-medium text-[#374151] shadow-2xs hover:border-[#D1D5DB] focus:outline-none focus:border-[#991B1B] cursor-pointer"
            >
              <option value={6}>Hiển thị 6 / trang</option>
              <option value={10}>Hiển thị 10 / trang</option>
              <option value={20}>Hiển thị 20 / trang</option>
              <option value={50}>Hiển thị 50 / trang</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] text-[10px]">
              ▾
            </span>
          </div>

          {/* Page numbers: < 1 2 3 4 > matching Mockup */}
          <nav aria-label="Phân trang" className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] shadow-2xs hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
              const isCurrent = page === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onPageChange(idx)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer',
                    isCurrent
                      ? 'bg-[#991B1B] text-white shadow-2xs'
                      : 'border border-transparent bg-transparent text-[#374151] hover:bg-[#F3F4F6]'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {idx + 1}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] shadow-2xs hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Trang tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
