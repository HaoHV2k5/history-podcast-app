import React, { useState } from 'react';
import {
  Eye,
  MoreVertical,
  Bell,
  Copy,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Activity,
  FileText,
  BookOpen,
  ShieldAlert,
  CreditCard,
  XSquare,
  PieChart,
  Mic,
  Scale,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import {
  AdminDisputeRow,
  getDisputeStatusConfig,
  getDisputePriorityConfig,
  extractInitials,
  getAvatarBg,
  copyToClipboard,
} from '../disputesLogic';

interface AdminDisputeTableProps {
  rows: AdminDisputeRow[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (row: AdminDisputeRow) => void;
  onResolveDispute?: (row: AdminDisputeRow) => void;
  onNavigateContract?: (contractId: number) => void;
  isLoading?: boolean;
}

/**
 * Returns icon and styling corresponding to dispute type category
 */
function renderDisputeTypeIcon(disputeType: string) {
  const type = (disputeType || '').toLowerCase();

  if (type.includes('chất lượng') || type.includes('âm thanh')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5]">
        <Activity className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('hoàn tiền') || type.includes('ký quỹ')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706]">
        <FileText className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('thuyết minh') || type.includes('sai sự thật') || type.includes('lịch sử')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]">
        <BookOpen className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('bản quyền') || type.includes('vi phạm')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48]">
        <ShieldAlert className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('thanh toán')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB]">
        <CreditCard className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('hủy')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626]">
        <XSquare className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('phân chia') || type.includes('doanh thu')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#FFF7ED] border border-[#FFEDD5] text-[#EA580C]">
        <PieChart className="h-4 w-4" />
      </div>
    );
  }
  if (type.includes('giọng đọc')) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488]">
        <Mic className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B]">
      <Scale className="h-4 w-4" />
    </div>
  );
}

export const AdminDisputeTable: React.FC<AdminDisputeTableProps> = ({
  rows,
  totalElements,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onResolveDispute,
  onNavigateContract,
  isLoading = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const handleCopy = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const success = await copyToClipboard(id);
    setCopiedId(id);
    if (success) {
      setToastMessage(`Đã sao chép mã ${id} vào bộ nhớ tạm!`);
    } else {
      setToastMessage(`Đã sao chép mã ${id}!`);
    }
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
    setOpenMenuRowId(null);
  };

  // Pagination helper: generates list of visible page numbers
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
              <th className="w-12 px-2.5 py-3.5 text-center whitespace-nowrap">#</th>
              {/* Mã khiếu nại */}
              <th className="w-[10%] min-w-[105px] px-3 py-3.5 text-left whitespace-nowrap">
                Mã khiếu nại
              </th>
              {/* Tiêu đề / Nội dung tóm tắt */}
              <th className="w-[23%] min-w-[210px] px-3 py-3.5 text-left whitespace-nowrap">
                Tiêu đề / Nội dung tóm tắt
              </th>
              {/* Người gửi */}
              <th className="w-[15%] min-w-[135px] px-3 py-3.5 text-left whitespace-nowrap">
                Người gửi
              </th>
              {/* Liên quan đến */}
              <th className="w-[15%] min-w-[135px] px-3 py-3.5 text-left whitespace-nowrap">
                Liên quan đến
              </th>
              {/* Ngày tạo */}
              <th className="w-[10%] min-w-[100px] px-3 py-3.5 text-left whitespace-nowrap">
                Ngày tạo
              </th>
              {/* Trạng thái (1 hàng duy nhất) */}
              <th className="w-[13%] min-w-[130px] px-3 py-3.5 text-left whitespace-nowrap">
                Trạng thái
              </th>
              {/* Ưu tiên */}
              <th className="w-[12%] min-w-[125px] px-3.5 py-3.5 text-left whitespace-nowrap">
                Ưu tiên
              </th>
              {/* Thao tác (1 hàng duy nhất) */}
              <th className="w-[175px] min-w-[175px] pl-4 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-[#F0EBE6] text-stone-800">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="w-12 px-2.5 py-4 text-center">
                    <div className="h-4 w-4 mx-auto rounded bg-stone-200" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-4 w-20 rounded bg-stone-200" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-stone-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-3/4 rounded bg-stone-200" />
                        <div className="h-3 w-1/2 rounded bg-stone-200" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-stone-200 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3.5 w-24 rounded bg-stone-200" />
                        <div className="h-3 w-14 rounded bg-stone-200" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      <div className="h-3.5 w-20 rounded bg-stone-200" />
                      <div className="h-3 w-28 rounded bg-stone-200" />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-4 w-20 rounded bg-stone-200" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-6 w-24 rounded-full bg-stone-200" />
                  </td>
                  <td className="px-3.5 py-4">
                    <div className="h-6 w-20 rounded-full bg-stone-200" />
                  </td>
                  <td className="w-[175px] min-w-[175px] pl-4 pr-4 sm:pr-5 py-4 text-right">
                    <div className="h-8 w-24 rounded-xl bg-stone-200 ml-auto" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                      <Scale className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-stone-900">
                        Chưa có khiếu nại hoặc tranh chấp nào
                      </p>
                      <p className="text-xs text-stone-500">
                        Không tìm thấy khiếu nại hợp đồng nào phù hợp với bộ lọc hiện tại.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Dispute Rows
              rows.map((row, index) => {
                const statusCfg = getDisputeStatusConfig(row.status);
                const priorityCfg = getDisputePriorityConfig(row.priority);
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

                    {/* 2. Mã khiếu nại + Bell icon */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-sans font-semibold text-stone-800">
                        <span className="tabular-nums">{row.id}</span>
                        {/* Bell icon indicator */}
                        <span
                          className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                          title="Có thông báo cập nhật"
                        >
                          <Bell className="h-3.5 w-3.5 text-stone-400 fill-stone-100" />
                        </span>
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopy(row.id, e)}
                          className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:outline-none"
                          title={isCopied ? 'Đã sao chép' : 'Sao chép mã'}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Tiêu đề / Nội dung tóm tắt */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderDisputeTypeIcon(row.disputeType)}
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-semibold text-stone-900 truncate max-w-[220px] xl:max-w-[260px] 2xl:max-w-none"
                            title={row.title}
                          >
                            {row.title}
                          </span>
                          <span
                            className="text-[11px] sm:text-xs text-stone-500 truncate max-w-[220px] xl:max-w-[260px] 2xl:max-w-none"
                            title={row.summary}
                          >
                            {row.summary}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Người gửi */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.senderAvatar ? (
                          <img
                            src={row.senderAvatar}
                            alt={row.senderName}
                            className="h-8 w-8 rounded-full object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(
                              row.senderName
                            )}`}
                          >
                            {extractInitials(row.senderName)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-medium text-stone-900 truncate max-w-[150px] xl:max-w-none"
                            title={row.senderName}
                          >
                            {row.senderName}
                          </span>
                          <span className="text-[11px] text-stone-400 truncate max-w-[150px] xl:max-w-none">
                            {row.senderRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Liên quan đến */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-stone-700 truncate max-w-[150px] xl:max-w-none tabular-nums">
                          Hợp đồng: {row.contractCode}
                        </span>
                        <span
                          className="text-[11px] text-stone-500 truncate max-w-[150px] xl:max-w-none"
                          title={row.workTitle}
                        >
                          Dự án: {row.workTitle}
                        </span>
                      </div>
                    </td>

                    {/* 6. Ngày tạo */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col font-sans tabular-nums">
                        <span className="text-stone-800 font-medium">{row.date}</span>
                        <span className="text-[11px] text-stone-400">{row.time}</span>
                      </div>
                    </td>

                    {/* 7. Trạng thái (1 HÀNG DUY NHẤT - whitespace-nowrap) */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 whitespace-nowrap ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusCfg.dotColor}`}
                        />
                        <span className="whitespace-nowrap">{statusCfg.label}</span>
                      </span>
                    </td>

                    {/* 8. Ưu tiên (Badge pill chuẩn mockup, không bao giờ bị dính) */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap ${priorityCfg.bgClass}`}
                      >
                        <Flag className="h-3 w-3 fill-current shrink-0" />
                        <span className="whitespace-nowrap">{priorityCfg.label}</span>
                      </span>
                    </td>

                    {/* 9. Thao tác (1 HÀNG DUY NHẤT, Ghost Icon Button, khoảng thở pl-4) */}
                    <td className="w-[175px] min-w-[175px] pl-4 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(row);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium shadow-2xs shrink-0 whitespace-nowrap transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-stone-500" />
                          <span>Xem chi tiết</span>
                        </button>

                        {/* Nút Ba chấm dọc (Ghost Icon Button) */}
                        <DropdownMenu
                          open={openMenuRowId === row.id}
                          onOpenChange={(isOpen) => setOpenMenuRowId(isOpen ? row.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Thao tác khác"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 p-1 rounded-xl bg-white border border-[#F0EBE6] shadow-lg z-[999] duration-200 ease-out font-sans text-xs"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuRowId(null);
                                onViewDetail(row);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-stone-400" />
                              <span>Xem chi tiết khiếu nại</span>
                            </button>

                            {row.status === 'OPEN' && onResolveDispute && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuRowId(null);
                                  onResolveDispute(row);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[#991B1B] hover:bg-[#FFF0F2] font-medium transition-colors cursor-pointer"
                              >
                                <Scale className="h-3.5 w-3.5 text-[#991B1B]" />
                                <span>Phân xử tranh chấp</span>
                              </button>
                            )}

                            {onNavigateContract && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuRowId(null);
                                  onNavigateContract(row.contractId);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                                <span>Xem hợp đồng {row.contractCode}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleCopy(row.id, e)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-stone-400" />
                              )}
                              <span>{isCopied ? `Đã sao chép ${row.id}` : `Sao chép mã ${row.id}`}</span>
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

      {/* TABLE FOOTER / PAGINATION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#F0EBE6] bg-[#FAF8F5] text-xs sm:text-[13px] text-stone-600 font-sans select-none">
        {/* Left: Summary Count */}
        <div className="tabular-nums">
          <span>Hiển thị </span>
          <span className="font-semibold text-stone-900">
            {totalElements === 0 ? 0 : currentPage * pageSize + 1}
          </span>
          <span>–</span>
          <span className="font-semibold text-stone-900">
            {Math.min((currentPage + 1) * pageSize, totalElements)}
          </span>
          <span> trong tổng số </span>
          <span className="font-semibold text-stone-900">{totalElements}</span>
          <span> khiếu nại</span>
        </div>

        {/* Right: Page Size Selector & Numbered Buttons */}
        <div className="flex items-center gap-3">
          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 hidden sm:inline">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(0);
              }}
              className="px-2 py-1 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-stone-700 focus:outline-none focus:border-[#991B1B] cursor-pointer"
            >
              <option value={8}>8 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              type="button"
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Numbers */}
            {getPageNumbers().map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-stone-400">
                    ...
                  </span>
                );
              }
              const pageIdx = num as number;
              const isActive = pageIdx === currentPage;
              return (
                <button
                  key={pageIdx}
                  type="button"
                  onClick={() => onPageChange(pageIdx)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#991B1B] text-white shadow-2xs'
                      : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {pageIdx + 1}
                </button>
              );
            })}

            {/* Next */}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
              className="p-1 rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Trang tiếp theo"
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
