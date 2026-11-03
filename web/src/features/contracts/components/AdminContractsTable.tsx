import React, { useState } from 'react';
import {
  Eye,
  MoreVertical,
  Layers,
  FileCheck2,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import type { AdminContractRow } from '../contractsLogic';

interface AdminContractsTableProps {
  rows: AdminContractRow[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (contract: AdminContractRow, tab?: 'milestones' | 'terms') => void;
  isLoading?: boolean;
}

export const AdminContractsTable: React.FC<AdminContractsTableProps> = ({
  rows,
  totalElements,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  isLoading = false,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const startIndex = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  // Multi-tier reliable clipboard copy engine (Async Clipboard API + Fallback)
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern navigator.clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard.writeText failed, falling back to execCommand:', err);
      }
    }

    // 2. Fallback to hidden textarea with execCommand('copy') for 100% browser/HTTP sandbox compatibility
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackErr) {
      console.error('All clipboard copy attempts failed:', fallbackErr);
      return false;
    }
  };

  const handleCopyCode = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) {
        pages.push(0, 1, 2, '...', totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        pages.push(0, '...', totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push(0, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1);
      }
    }
    return pages;
  };

  return (
    <div className="relative z-10 w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs">
      {/* Table Container */}
      <div className="w-full overflow-x-auto lg:overflow-x-visible">
        <table className="table-auto sm:table-fixed w-full border-collapse font-sans text-left text-xs sm:text-[13px]">
          {/* Table Header */}
          <thead className="bg-[#FAF8F5] border-b border-[#F0EBE6] text-stone-500 font-medium">
            <tr>
              <th className="w-12 py-3.5 px-2.5 text-center text-xs font-semibold uppercase tracking-wider text-stone-400">
                #
              </th>
              <th className="w-[10%] min-w-[90px] py-3.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                MÃ HỢP ĐỒNG
              </th>
              <th className="w-[23%] min-w-[170px] py-3.5 px-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                TÁC PHẨM
              </th>
              <th className="w-[19%] min-w-[160px] py-3.5 px-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                THUYẾT MINH VIÊN
              </th>
              <th className="w-[11%] min-w-[100px] py-3.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                NGÀY KÝ
              </th>
              <th className="w-[11%] min-w-[105px] py-3.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap text-right">
                GIÁ TRỊ HỢP ĐỒNG
              </th>
              <th className="w-[13%] min-w-[125px] py-3.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap text-center">
                TRẠNG THÁI
              </th>
              <th className="w-[170px] min-w-[170px] py-3.5 pl-2 pr-4 sm:pr-5 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap text-right">
                THAO TÁC
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#F0EBE6]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#991B1B] border-t-transparent" />
                    <span className="text-xs font-medium">Đang tải danh sách hợp đồng...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-2xl bg-[#FFF0F2] text-[#991B1B] flex items-center justify-center mb-1 border border-[#FFE4E8]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-stone-700">
                      {totalElements === 0
                        ? 'Chưa có hợp đồng thu âm nào trong hệ thống'
                        : 'Không tìm thấy hợp đồng thu âm phù hợp'}
                    </span>
                    <span className="text-xs text-stone-400 leading-relaxed">
                      {totalElements === 0
                        ? 'Khi Người đặt nội dung và Creator hoàn tất thỏa thuận lộ trình, danh sách hợp đồng sẽ tự động hiển thị tại đây.'
                        : 'Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc để hiển thị kết quả.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const stt = currentPage * pageSize + idx + 1;
                const isCopied = copiedCode === row.code;

                return (
                  <tr
                    key={row.id}
                    className="group hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
                    onClick={() => onViewDetail(row, 'milestones')}
                  >
                    {/* 1. STT */}
                    <td className="w-12 py-3 px-2.5 text-center text-stone-400 font-sans tabular-nums text-xs">
                      {stt}
                    </td>

                    {/* 2. Mã hợp đồng (HD00128) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-900 font-sans tabular-nums">
                          {row.code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(row.code, e)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 p-0.5 rounded transition-opacity"
                          title="Sao chép mã"
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Tác phẩm & Kênh */}
                    <td className="py-3 px-3">
                      <div className="min-w-0 pr-2">
                        <span
                          className="font-medium text-stone-900 block truncate hover:text-[#991B1B] transition-colors"
                          title={row.title}
                        >
                          {row.title}
                        </span>
                        <span
                          className="text-[11px] text-stone-400 block truncate"
                          title={row.channelOrSeries}
                        >
                          {row.channelOrSeries}
                        </span>
                      </div>
                    </td>

                    {/* 4. Thuyết minh viên */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        {row.narratorAvatarUrl ? (
                          <img
                            src={row.narratorAvatarUrl}
                            alt={row.narratorName}
                            className="h-8 w-8 rounded-full object-cover shrink-0 border border-[#F0EBE6]"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#FFF0F2] border border-[#FFE4E8] text-[#991B1B] font-semibold text-xs flex items-center justify-center shrink-0">
                            {row.narratorInitials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span
                            className="font-medium text-stone-800 block truncate text-xs sm:text-[13px]"
                            title={row.narratorName}
                          >
                            {row.narratorName}
                          </span>
                          <span
                            className="text-[11px] text-stone-400 block truncate"
                            title={row.narratorEmail}
                          >
                            {row.narratorEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Ngày ký */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-stone-700 font-sans tabular-nums text-xs leading-snug">
                        <span className="block font-medium">{row.dateStr}</span>
                        <span className="block text-[11px] text-stone-400">{row.timeStr}</span>
                      </div>
                    </td>

                    {/* 6. Giá trị hợp đồng */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <span className="font-bold text-stone-900 font-sans tabular-nums text-xs sm:text-[13px]">
                        {row.totalAmountFormatted}
                      </span>
                    </td>

                    {/* 7. Trạng thái (1 HÀNG DUY NHẤT) */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border"
                        style={{
                          backgroundColor: row.statusConfig.bg,
                          color: row.statusConfig.text,
                          borderColor: row.statusConfig.border,
                        }}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${row.statusConfig.dot}`} />
                        <span className="whitespace-nowrap">{row.statusConfig.label}</span>
                      </div>
                    </td>

                    {/* 8. Thao tác (1 HÀNG DUY NHẤT: Xem chi tiết + Ba chấm thanh thoát chuẩn mockup) */}
                    <td className="w-[170px] min-w-[170px] py-3 pl-2 pr-4 sm:pr-5 whitespace-nowrap text-right">
                      <div
                        className="inline-flex items-center justify-end gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onViewDetail(row, 'milestones')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                          <span className="whitespace-nowrap">Xem chi tiết</span>
                        </button>

                        {/* More Actions Dropdown (Icon 3 chấm dọc trần thanh lịch chuẩn mockup) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex h-8 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
                              aria-label="Thao tác khác"
                              title="Thao tác khác"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 p-1.5 rounded-xl border border-[#E7E5E4] bg-white shadow-lg z-[999]"
                          >
                            <button
                              type="button"
                              onClick={() => onViewDetail(row, 'milestones')}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors"
                            >
                              <Layers className="h-4 w-4 text-stone-400" />
                              <span>Tiến trình cột mốc</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onViewDetail(row, 'terms')}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors"
                            >
                              <FileCheck2 className="h-4 w-4 text-stone-400" />
                              <span>Điều khoản & Chữ ký</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(row.code, e)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors border-t border-[#F0EBE6] mt-1 pt-1.5 cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span className="text-emerald-700 font-semibold">Đã sao chép!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 text-stone-400 shrink-0" />
                                  <span>Sao chép mã HD</span>
                                </>
                              )}
                            </button>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-[#FAF8F5] border-t border-[#F0EBE6] select-none text-xs text-stone-500">
        {/* Left: Summary */}
        <div className="text-stone-600 font-sans">
          <span>Hiển thị </span>
          <strong className="text-stone-900 font-semibold tabular-nums">
            {startIndex}–{endIndex}
          </strong>
          <span> trong tổng số </span>
          <strong className="text-stone-900 font-semibold tabular-nums">
            {totalElements}
          </strong>
          <span> hợp đồng</span>
        </div>

        {/* Center: Page Size Selector */}
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>

        {/* Right: Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((p, index) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="h-8 w-8 flex items-center justify-center text-stone-400 font-sans"
                >
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold font-sans tabular-nums transition-colors ${isCurrent
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                  }`}
              >
                {p + 1}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating Toast Notification khi sao chép thành công */}
      {copiedCode && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1C1917] text-white text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            Đã sao chép mã hợp đồng <strong className="font-mono text-emerald-300 font-semibold">{copiedCode}</strong> vào bộ nhớ tạm!
          </span>
        </div>
      )}
    </div>
  );
};

