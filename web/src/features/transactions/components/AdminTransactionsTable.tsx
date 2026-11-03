import React from 'react';
import {
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Inbox,
  SearchX,
  Copy,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { AdminTransactionRow, getAvatarInitials } from '../transactionsLogic';
import { cn } from '@/utils/cn';

interface AdminTransactionsTableProps {
  rows: AdminTransactionRow[];
  isLoading: boolean;
  onSelectRow: (row: AdminTransactionRow) => void;
  page: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}

export const AdminTransactionsTable: React.FC<AdminTransactionsTableProps> = ({
  rows,
  isLoading,
  onSelectRow,
  page,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
  isFiltered,
  onResetFilters,
}) => {
  // Safe avatar background colors matching pastel style in mockup
  const avatarColors = [
    'bg-[#FCE7F3] text-[#9D174D]', // Pink
    'bg-[#E0E7FF] text-[#4338CA]', // Indigo
    'bg-[#FEF3C7] text-[#B45309]', // Amber
    'bg-[#D1FAE5] text-[#065F46]', // Emerald
    'bg-[#FFEDD5] text-[#C2410C]', // Orange
  ];

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const startIndex = totalElements === 0 ? 0 : page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalElements);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#F0EBE6] bg-white p-12 text-center shadow-xs font-sans">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#991B1B] border-r-transparent align-[-0.125em]" />
        <p className="mt-3 text-xs font-medium text-stone-500">
          Đang tải dữ liệu biến động số dư hệ thống...
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[#F0EBE6] bg-white p-12 text-center shadow-xs space-y-3 font-sans">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFFBF7] border border-[#F5EBE1] text-[#991B1B]">
          {isFiltered ? <SearchX className="h-7 w-7" /> : <Inbox className="h-7 w-7" />}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#1F1612]">
            {isFiltered ? 'Không tìm thấy giao dịch phù hợp' : 'Chưa có biến động số dư nào'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {isFiltered
              ? 'Không có giao dịch nào khớp với bộ lọc hiện tại. Vui lòng thử tìm kiếm khác hoặc đặt lại bộ lọc.'
              : 'Các giao dịch nạp tiền, rút tiền, ký quỹ và phân phối doanh thu sẽ tự động xuất hiện tại đây khi phát sinh.'}
          </p>
        </div>
        {isFiltered && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-3 text-xs text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2] rounded-xl cursor-pointer"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs font-sans select-none">
      {/* Table responsive container: fits 100% on desktop with zero horizontal scrollbar */}
      <div className="w-full overflow-x-auto lg:overflow-x-visible">
        <table className="w-full text-left border-collapse table-auto sm:table-fixed">
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5]/90 text-[11px] font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th className="py-3.5 pl-4 pr-1 w-10 text-center">#</th>
              <th className="py-3.5 px-2.5 w-[11%]">Thời gian</th>
              <th className="py-3.5 px-2.5 w-[19%]">Người dùng</th>
              <th className="py-3.5 px-2.5 w-[11%]">Loại giao dịch</th>
              <th className="py-3.5 px-2.5 w-[12%] text-right">Số tiền</th>
              <th className="py-3.5 px-2.5 w-[11%] text-right whitespace-nowrap">Số dư sau GD</th>
              <th className="py-3.5 px-2.5 w-[18%]">Nội dung</th>
              <th className="py-3.5 px-2.5 w-[11%]">Trạng thái</th>
              <th className="py-3.5 pl-2 pr-4 w-[95px] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE6]/60 text-xs text-stone-700">
            {rows.map((row, idx) => {
              const rowNumber = page * pageSize + idx + 1;
              const initials = getAvatarInitials(row.userName);
              const colorClass = avatarColors[idx % avatarColors.length];

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectRow(row)}
                  className="transition-all duration-150 hover:bg-[#FFFBF7] active:bg-[#FEE2E2]/20 cursor-pointer group select-none"
                  title={`Nhấp để xem chi tiết giao dịch #${row.id}`}
                >
                  {/* Cột 1: STT */}
                  <td className="py-3.5 pl-4 pr-1 text-center font-mono text-stone-400 text-xs">
                    {rowNumber}
                  </td>

                  {/* Cột 2: Thời gian */}
                  <td className="py-3.5 px-2.5 whitespace-nowrap">
                    <div className="font-semibold text-stone-800 text-xs font-sans">
                      {row.formattedDate}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      {row.formattedTime}
                    </div>
                  </td>

                  {/* Cột 3: Người dùng */}
                  <td className="py-3.5 px-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {row.userAvatar ? (
                        <img
                          src={row.userAvatar}
                          alt={row.userName}
                          className="h-8 w-8 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-2xs border border-white',
                            colorClass
                          )}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#1F1612] truncate text-xs group-hover:text-[#991B1B] transition-colors">
                          {row.userName}
                        </span>
                        <span className="text-[11px] text-stone-400 truncate">
                          {row.userEmail}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cột 4: Loại giao dịch */}
                  <td className="py-3.5 px-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border',
                        row.typeBadgeClass || 'bg-stone-50 text-stone-700 border-stone-200'
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', row.typeColor)} />
                      <span>{row.typeLabel}</span>
                    </span>
                  </td>

                  {/* Cột 5: Số tiền */}
                  <td className="py-3.5 px-2.5 text-right whitespace-nowrap font-mono tabular-nums">
                    <span
                      className={cn(
                        'font-bold text-xs',
                        row.isPositive ? 'text-emerald-700' : 'text-rose-700'
                      )}
                    >
                      {row.amountDisplay}
                    </span>
                  </td>

                  {/* Cột 6: Số dư sau GD */}
                  <td className="py-3.5 px-2.5 text-right whitespace-nowrap font-mono tabular-nums text-xs text-stone-500">
                    {row.balanceAfterDisplay}
                  </td>

                  {/* Cột 7: Nội dung */}
                  <td className="py-3.5 px-2.5">
                    <div
                      className="text-xs text-stone-700 truncate max-w-[200px]"
                      title={row.description}
                    >
                      {row.description}
                    </div>
                  </td>

                  {/* Cột 8: Trạng thái */}
                  <td className="py-3.5 px-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                        row.statusBadgeClass || 'bg-stone-50 text-stone-700 border-stone-200'
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', row.statusColor)} />
                      <span>{row.statusLabel}</span>
                    </span>
                  </td>

                  {/* Cột 9: Thao tác (Xem + Menu ba chấm ...) */}
                  <td className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow(row);
                        }}
                        className="h-8 px-2 text-xs font-medium text-stone-700 hover:text-[#991B1B] hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xem chi tiết giao dịch"
                      >
                        <Eye className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#991B1B]" />
                        <span className="hidden xl:inline ml-1">Xem</span>
                      </Button>

                      {/* Nút Ba Chấm Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] cursor-pointer"
                            aria-label="Tùy chọn khác"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 font-sans z-[900]">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRow(row);
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Eye className="mr-2 h-3.5 w-3.5 text-stone-500" />
                            <span>Xem chi tiết sổ cái</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(
                                String(row.merchantTxnRef || row.id)
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
                              navigator.clipboard?.writeText(
                                `${row.typeLabel} - ${row.userName} - ${row.amountDisplay} (${row.statusLabel})`
                              );
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Receipt className="mr-2 h-3.5 w-3.5 text-stone-500" />
                            <span>Sao chép thông tin GD</span>
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
            Hiển thị{' '}
            <span className="font-semibold text-stone-800">
              {startIndex}–{endIndex}
            </span>{' '}
            trong tổng số{' '}
            <span className="font-semibold text-stone-800">{totalElements}</span> giao dịch
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
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
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    isActive
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 shadow-2xs'
                  )}
                >
                  {pageIdx + 1}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
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
