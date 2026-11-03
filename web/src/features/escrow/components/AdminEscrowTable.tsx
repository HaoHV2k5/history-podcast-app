import React, { useState } from 'react';
import {
  Eye,
  MoreVertical,
  Copy,
  Check,
  Music,
  ExternalLink,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import {
  AdminEscrowRow,
  getEscrowStatusConfig,
  formatCurrencyVND,
  extractInitials,
  copyToClipboard,
} from '../escrowLogic';

interface AdminEscrowTableProps {
  rows: AdminEscrowRow[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  onViewDetail: (row: AdminEscrowRow) => void;
  onViewContract?: (contractId: number) => void;
  onViewMilestones?: (row: AdminEscrowRow) => void;
}

export const AdminEscrowTable: React.FC<AdminEscrowTableProps> = ({
  rows,
  totalElements,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  onViewDetail,
  onViewContract,
  onViewMilestones,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const handleCopy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(id);
    if (success) {
      setCopiedId(id);
      setToastMessage(`Đã sao chép mã ${id} vào bộ nhớ tạm!`);
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage(null);
      }, 2500);
    }
    // Close dropdown menu if open
    setOpenMenuRowId(null);
  };

  // Avatar pastel background colors
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-emerald-100 text-emerald-700',
      'bg-sky-100 text-sky-700',
      'bg-indigo-100 text-indigo-700',
      'bg-purple-100 text-purple-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const startIndex = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push('...');
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="relative z-10 w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs">
      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="table-auto sm:table-fixed w-full border-collapse font-sans text-xs sm:text-[13px] text-stone-700 select-none">
          {/* TABLE HEADER */}
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5] text-stone-500 font-semibold text-[11px] sm:text-xs uppercase tracking-wider">
              {/* # */}
              <th className="w-12 px-2.5 py-3.5 text-center">#</th>
              {/* Mã giao dịch */}
              <th className="w-[11%] min-w-[105px] px-3 py-3.5 text-left whitespace-nowrap">
                Mã giao dịch
              </th>
              {/* Tác phẩm / Hợp đồng */}
              <th className="w-[18%] min-w-[170px] px-3 py-3.5 text-left whitespace-nowrap">
                Tác phẩm / Hợp đồng
              </th>
              {/* Bên ký quỹ */}
              <th className="w-[15%] min-w-[145px] px-3 py-3.5 text-left whitespace-nowrap">
                Bên ký quỹ
              </th>
              {/* Bên nhận */}
              <th className="w-[15%] min-w-[145px] px-3 py-3.5 text-left whitespace-nowrap">
                Bên nhận
              </th>
              {/* Số tiền ký quỹ */}
              <th className="w-[12%] min-w-[110px] px-3 py-3.5 text-right whitespace-nowrap">
                Số tiền ký quỹ
              </th>
              {/* Trạng thái - BẮT BUỘC 1 HÀNG DUY NHẤT */}
              <th className="w-[14%] min-w-[140px] px-3 py-3.5 text-left whitespace-nowrap">
                Trạng thái
              </th>
              {/* Ngày tạo */}
              <th className="w-[12%] min-w-[105px] px-3 py-3.5 text-left whitespace-nowrap">
                Ngày tạo
              </th>
              {/* Thao tác - BẮT BUỘC w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 text-right */}
              <th className="w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-[#F0EBE6]">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse bg-white">
                  <td className="p-4 text-center">
                    <div className="h-4 w-4 bg-stone-200 rounded mx-auto" />
                  </td>
                  <td className="p-4">
                    <div className="h-4 w-20 bg-stone-200 rounded" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-stone-200 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-32 bg-stone-200 rounded" />
                        <div className="h-3 w-16 bg-stone-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-stone-200 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 bg-stone-200 rounded" />
                        <div className="h-3 w-32 bg-stone-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-stone-200 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 bg-stone-200 rounded" />
                        <div className="h-3 w-32 bg-stone-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="h-4 w-24 bg-stone-200 rounded ml-auto" />
                  </td>
                  <td className="p-4">
                    <div className="h-6 w-28 bg-stone-200 rounded-full" />
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="h-3.5 w-20 bg-stone-200 rounded" />
                      <div className="h-3 w-16 bg-stone-100 rounded" />
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="h-8 w-28 bg-stone-200 rounded-xl ml-auto" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="py-14 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-[#FFF0F2] text-[#991B1B] flex items-center justify-center mx-auto border border-rose-200">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-stone-900">
                        Chưa có giao dịch ký quỹ nào
                      </p>
                      <p className="text-xs text-stone-500">
                        Không tìm thấy khoản ký quỹ hoặc đối soát nào phù hợp với bộ lọc hiện tại.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Real / Mockup-Aligned Rows
              rows.map((row, index) => {
                const statusCfg = getEscrowStatusConfig(row.status);
                const isCopied = copiedId === row.id;

                return (
                  <tr
                    key={row.id}
                    onClick={() => onViewDetail(row)}
                    className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                  >
                    {/* 1. # */}
                    <td className="w-12 px-2.5 py-3.5 text-center text-stone-400 font-sans tabular-nums">
                      {currentPage * pageSize + index + 1}
                    </td>

                    {/* 2. Mã giao dịch */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-sans font-semibold text-stone-800">
                        <span className="tabular-nums">{row.id}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(row.id, e)}
                          className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors group-hover:opacity-100 focus:outline-none"
                          title={isCopied ? 'Đã sao chép' : 'Sao chép mã'}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Tác phẩm / Hợp đồng */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {row.thumbnail ? (
                          <img
                            src={row.thumbnail}
                            alt={row.workTitle}
                            className="h-10 w-10 rounded-xl object-cover border border-[#F0EBE6] shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                            <Music className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-semibold text-stone-900 truncate max-w-[180px] group-hover:text-[#991B1B] transition-colors"
                            title={row.workTitle}
                          >
                            {row.workTitle}
                          </span>
                          <span className="text-[11px] text-stone-400 tabular-nums">
                            {row.contractCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Bên ký quỹ */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.payerAvatar ? (
                          <img
                            src={row.payerAvatar}
                            alt={row.payerName}
                            className="h-8 w-8 rounded-full object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(
                              row.payerName
                            )}`}
                          >
                            {extractInitials(row.payerName)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-stone-900 truncate max-w-[130px]" title={row.payerName}>
                            {row.payerName}
                          </span>
                          <span className="text-[11px] text-stone-400 truncate max-w-[130px]" title={row.payerEmail}>
                            {row.payerEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Bên nhận */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.payeeAvatar ? (
                          <img
                            src={row.payeeAvatar}
                            alt={row.payeeName}
                            className="h-8 w-8 rounded-full object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(
                              row.payeeName
                            )}`}
                          >
                            {extractInitials(row.payeeName)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-stone-900 truncate max-w-[130px]" title={row.payeeName}>
                            {row.payeeName}
                          </span>
                          <span className="text-[11px] text-stone-400 truncate max-w-[130px]" title={row.payeeEmail}>
                            {row.payeeEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 6. Số tiền ký quỹ */}
                    <td className="px-3 py-3.5 text-right whitespace-nowrap">
                      <span className="font-sans font-bold tabular-nums text-stone-900 text-xs sm:text-[13px]">
                        {formatCurrencyVND(row.grossAmount)}
                      </span>
                    </td>

                    {/* 7. Trạng thái - BẮT BUỘC 1 HÀNG DUY NHẤT */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border whitespace-nowrap ${statusCfg.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 mr-1.5 ${statusCfg.dotColor}`}
                        />
                        <span className="whitespace-nowrap">{statusCfg.label}</span>
                      </span>
                    </td>

                    {/* 8. Ngày tạo */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col text-stone-600 font-sans tabular-nums text-[11px] sm:text-xs">
                        <span>{row.date}</span>
                        <span className="text-stone-400 text-[10px] sm:text-[11px]">{row.time}</span>
                      </div>
                    </td>

                    {/* 9. Thao tác - BẮT BUỘC w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 text-right */}
                    <td
                      className="w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
                        {/* 1. Nút [👁 Xem chi tiết] */}
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuRowId(null);
                            onViewDetail(row);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium shadow-2xs transition-colors shrink-0 whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5 text-stone-500" />
                          <span>Xem chi tiết</span>
                        </button>

                        {/* 2. Ghost Icon Button ⋮ (Controlled để không bị kẹt khi mở modal) */}
                        <DropdownMenu
                          open={openMenuRowId === row.id}
                          onOpenChange={(isOpen) => setOpenMenuRowId(isOpen ? row.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors focus:outline-none shrink-0"
                              title="Tùy chọn khác"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-52 p-1.5 rounded-xl border border-[#E7E5E4] bg-white shadow-lg text-xs font-sans z-[999]"
                          >
                            <button
                              type="button"
                              onClick={(e) => handleCopy(row.id, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5 text-stone-400" />
                              <span>Sao chép mã ({row.id})</span>
                            </button>

                            {onViewContract && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuRowId(null);
                                  onViewContract(row.contractId);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                                <span>Xem hợp đồng ({row.contractCode})</span>
                              </button>
                            )}

                            {onViewMilestones && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuRowId(null);
                                  onViewMilestones(row);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors"
                              >
                                <Clock className="h-3.5 w-3.5 text-stone-400" />
                                <span>Đối soát mốc Milestone</span>
                              </button>
                            )}
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

      {/* Pagination Footer - Chuẩn Sử Ký Mockup */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-[#FAF8F5] border-t border-[#F0EBE6] select-none text-xs text-stone-500 font-sans">
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
          <span> giao dịch</span>
        </div>

        {/* Right: Page Size Selector & Number Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Hiển thị</span>
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
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold font-sans tabular-nums transition-colors ${
                    isCurrent
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
      </div>

      {/* Floating Toast Notification khi sao chép thành công */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1C1917] text-white text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
