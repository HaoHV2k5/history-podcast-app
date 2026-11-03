import React from 'react';
import {
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Crown,
  Gem,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Copy,
  Receipt,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { PaymentDisplayRow, getAvatarInitials } from '../membershipLogic';
import { formatVND, formatDateTime } from '@/utils/formatters';

interface AdminMembershipTransactionsTableProps {
  items: PaymentDisplayRow[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
  onViewDetail: (item: PaymentDisplayRow) => void;
  isLoading?: boolean;
}

export const AdminMembershipTransactionsTable: React.FC<
  AdminMembershipTransactionsTableProps
> = ({
  items,
  totalElements,
  page,
  size,
  totalPages,
  onPageChange,
  onSizeChange,
  onViewDetail,
  isLoading,
}) => {
  // Safe avatar background colors matching pastel style in mockup
  const avatarColors = [
    'bg-[#FCE7F3] text-[#9D174D]', // Pink
    'bg-[#E0E7FF] text-[#4338CA]', // Indigo
    'bg-[#FEF3C7] text-[#B45309]', // Amber
    'bg-[#D1FAE5] text-[#065F46]', // Emerald
    'bg-[#FFEDD5] text-[#C2410C]', // Orange
  ];

  const startRecord = totalElements > 0 ? page * size + 1 : 0;
  const endRecord = Math.min((page + 1) * size, totalElements);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#F0EBE6] bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#991B1B] border-r-transparent align-[-0.125em]" />
        <p className="mt-3 text-xs text-stone-500 font-medium">Đang tải dữ liệu giao dịch gói hội viên...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#F0EBE6] bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-50 border border-stone-200 text-stone-400">
          <Inbox className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-[#1F1612]">Chưa có giao dịch hội viên</h3>
        <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
          Chưa phát sinh giao dịch đăng ký gói hội viên nào trong hệ thống hoặc không khớp với bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs">
      {/* Table Container fits 100% without horizontal scrollbar */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse table-auto sm:table-fixed">
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5]/90 text-[11px] font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th className="py-3.5 pl-5 pr-2 w-10 text-center">#</th>
              <th className="py-3.5 px-3 w-[24%]">Người dùng</th>
              <th className="py-3.5 px-3 w-[17%]">Gói hội viên</th>
              <th className="py-3.5 px-3 w-[12%]">Số tiền</th>
              <th className="py-3.5 px-3 w-[15%]">Phương thức</th>
              <th className="py-3.5 px-3 w-[13%]">Trạng thái</th>
              <th className="py-3.5 px-3 w-[13%]">Ngày thanh toán</th>
              <th className="py-3.5 pl-2 pr-5 w-[85px] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE6]/60 text-xs text-stone-700">
            {items.map((row, idx) => {
              const rowNumber = page * size + idx + 1;
              const initials = getAvatarInitials(row.userName);
              const colorClass = avatarColors[idx % avatarColors.length];

              return (
                <tr
                  key={row.id}
                  onClick={() => onViewDetail(row)}
                  className="transition-all duration-150 hover:bg-[#FFFBF7] active:bg-[#FEE2E2]/20 cursor-pointer group select-none"
                  title={`Nhấp để xem chi tiết giao dịch #${row.id}`}
                >
                  {/* Column 1: Index */}
                  <td className="py-3.5 pl-5 pr-2 text-center font-mono text-stone-400 text-xs">
                    {rowNumber}
                  </td>

                  {/* Column 2: User (Avatar + Name + Email) */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {row.userAvatar ? (
                        <img
                          src={row.userAvatar}
                          alt={row.userName}
                          className="h-8 w-8 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-2xs border border-white ${colorClass}`}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#1F1612] truncate group-hover:text-[#991B1B] transition-colors">
                          {row.userName}
                        </span>
                        <span className="text-[11px] text-stone-400 truncate">
                          {row.userEmail}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Membership Tier Badge */}
                  <td className="py-3.5 px-3">
                    {row.planName.includes('VIP') ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FCE7F3] px-2.5 py-1 text-[11px] font-bold text-[#9D174D] border border-[#FBCFE8]">
                        <Gem className="h-3 w-3 text-[#9D174D]" />
                        <span className="truncate">{row.planName}</span>
                      </span>
                    ) : row.planName.includes('Cao Cấp') ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#B45309] border border-[#FDE68A]">
                        <Crown className="h-3 w-3 text-[#B45309]" />
                        <span className="truncate">{row.planName}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-bold text-[#991B1B] border border-[#FECACA]">
                        <Crown className="h-3 w-3 text-[#991B1B]" />
                        <span className="truncate">{row.planName}</span>
                      </span>
                    )}
                  </td>

                  {/* Column 4: Amount */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-[#1F1612] font-mono tabular-nums">
                      {formatVND(row.amount)}
                    </span>
                  </td>

                  {/* Column 5: Payment Method */}
                  <td className="py-3.5 px-3">
                    {row.paymentMethodType === 'vnpay' ? (
                      <div className="inline-flex items-center gap-1 font-bold text-xs tracking-tight">
                        <span className="text-[#005BAA]">VN</span>
                        <span className="text-[#ED1C24]">PAY</span>
                      </div>
                    ) : row.paymentMethodType === 'momo' ? (
                      <div className="inline-flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#A50064] text-[9px] font-extrabold text-white">
                          mo
                        </div>
                        <span className="font-semibold text-stone-700">MoMo</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-stone-700">
                        <div className="flex h-5 w-5 items-center justify-center rounded border border-sky-200 bg-sky-50 text-sky-600">
                          <CreditCard className="h-3 w-3" />
                        </div>
                        <span className="font-medium truncate">{row.paymentMethod}</span>
                      </div>
                    )}
                  </td>

                  {/* Column 6: Status */}
                  <td className="py-3.5 px-3">
                    {row.statusVariant === 'success' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{row.statusLabel}</span>
                      </span>
                    )}
                    {row.statusVariant === 'warning' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{row.statusLabel}</span>
                      </span>
                    )}
                    {row.statusVariant === 'error' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{row.statusLabel}</span>
                      </span>
                    )}
                    {row.statusVariant === 'neutral' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                        <span>{row.statusLabel}</span>
                      </span>
                    )}
                  </td>

                  {/* Column 7: Paid At */}
                  <td className="py-3.5 px-3 text-stone-500 font-mono text-[11px] tabular-nums">
                    {row.paidAt ? formatDateTime(row.paidAt) : '—'}
                  </td>

                  {/* Column 8: Actions */}
                  <td className="py-3.5 pl-2 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(row);
                        }}
                        className="h-8 px-2 text-xs font-medium text-stone-700 hover:text-[#991B1B] hover:bg-rose-50 transition-colors"
                        title="Xem chi tiết giao dịch"
                      >
                        <Eye className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#991B1B]" />
                        <span className="hidden md:inline ml-1">Xem</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]"
                            aria-label="Tùy chọn khác"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetail(row);
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Eye className="mr-2 h-3.5 w-3.5 text-stone-500" />
                            <span>Xem chi tiết thanh toán</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(
                                `Giao dịch #${row.id} - ${row.userName} - ${formatVND(row.amount)}`
                              );
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Copy className="mr-2 h-3.5 w-3.5 text-stone-500" />
                            <span>Sao chép mã giao dịch</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.alert(
                                `Biên lai thanh toán #${row.id}:\nNgười dùng: ${row.userName}\nSố tiền: ${formatVND(row.amount)}\nTrạng thái: ${row.statusLabel}`
                              );
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Receipt className="mr-2 h-3.5 w-3.5 text-stone-500" />
                            <span>In biên lai thanh toán</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching mockup 100% */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#F0EBE6] bg-[#FAF8F5]/60 px-6 py-3.5 text-xs text-stone-500 select-none">
        <div>
          <span>
            Hiển thị <span className="font-semibold text-stone-800">{startRecord}–{endRecord}</span> trong tổng số{' '}
            <span className="font-semibold text-stone-800">{totalElements}</span> giao dịch
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Hiển thị</span>
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-[#E7E5E4] bg-white px-2 text-xs text-stone-700 font-medium focus:outline-none focus:border-[#991B1B] cursor-pointer shadow-2xs"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>

          {/* Navigation page buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
              const pageIdx = i;
              const isActive = page === pageIdx;
              return (
                <button
                  key={pageIdx}
                  type="button"
                  onClick={() => onPageChange(pageIdx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 shadow-2xs'
                  }`}
                >
                  {pageIdx + 1}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
              aria-label="Trang tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
