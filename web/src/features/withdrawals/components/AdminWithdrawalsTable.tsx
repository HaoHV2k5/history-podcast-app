import React, { useState } from 'react';
import {
  Eye,
  MoreVertical,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import { AdminWithdrawalRow } from '../withdrawalsLogic';

interface AdminWithdrawalsTableProps {
  rows: AdminWithdrawalRow[];
  totalElements: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  isLoading?: boolean;
  onViewDetail: (row: AdminWithdrawalRow) => void;
  onProcessRequest: (row: AdminWithdrawalRow) => void;
  onCompleteRequest: (row: AdminWithdrawalRow) => void;
  onRejectRequest: (row: AdminWithdrawalRow) => void;
  onFailRequest: (row: AdminWithdrawalRow) => void;
}

// Mini Bank Logo Component
export const BankLogoBadge: React.FC<{ bankName?: string; code?: string }> = ({
  bankName = '',
  code = '',
}) => {
  const norm = bankName.toLowerCase();

  if (norm.includes('vietcombank') || code === 'VCB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#005826] text-white font-bold text-[10px] shadow-2xs">
          VCB
        </div>
        <span className="font-semibold text-xs text-stone-800">Vietcombank</span>
      </div>
    );
  }
  if (norm.includes('mb') || code === 'MB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#D32F2F] text-white font-bold text-[10px] shadow-2xs">
          MB
        </div>
        <span className="font-semibold text-xs text-stone-800">MB Bank</span>
      </div>
    );
  }
  if (norm.includes('techcombank') || code === 'TCB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E53935] text-white font-bold text-[10px] shadow-2xs">
          TCB
        </div>
        <span className="font-semibold text-xs text-stone-800">Techcombank</span>
      </div>
    );
  }
  if (norm.includes('bidv') || code === 'BIDV') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F57C00] text-white font-bold text-[9px] shadow-2xs">
          BIDV
        </div>
        <span className="font-semibold text-xs text-stone-800">BIDV</span>
      </div>
    );
  }
  if (norm.includes('vietinbank') || code === 'CTG') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0288D1] text-white font-bold text-[9px] shadow-2xs">
          CTG
        </div>
        <span className="font-semibold text-xs text-stone-800">VietinBank</span>
      </div>
    );
  }
  if (norm.includes('acb') || code === 'ACB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1976D2] text-white font-bold text-[10px] shadow-2xs">
          ACB
        </div>
        <span className="font-semibold text-xs text-stone-800">ACB</span>
      </div>
    );
  }
  if (norm.includes('tpbank') || code === 'TPB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#8E24AA] text-white font-bold text-[10px] shadow-2xs">
          TPB
        </div>
        <span className="font-semibold text-xs text-stone-800">TPBank</span>
      </div>
    );
  }
  if (norm.includes('sacombank') || code === 'STB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1565C0] text-white font-bold text-[9px] shadow-2xs">
          STB
        </div>
        <span className="font-semibold text-xs text-stone-800">Sacombank</span>
      </div>
    );
  }
  if (norm.includes('vpbank') || code === 'VPB') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2E7D32] text-white font-bold text-[10px] shadow-2xs">
          VPB
        </div>
        <span className="font-semibold text-xs text-stone-800">VPBank</span>
      </div>
    );
  }
  if (norm.includes('agribank') || code === 'VBA') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#B71C1C] text-white font-bold text-[9px] shadow-2xs">
          VBA
        </div>
        <span className="font-semibold text-xs text-stone-800">Agribank</span>
      </div>
    );
  }

  // Fallback Generic Bank
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-600 border border-stone-200">
        <Building2 className="h-3.5 w-3.5" />
      </div>
      <span className="font-semibold text-xs text-stone-800 truncate">{bankName || 'Ngân hàng'}</span>
    </div>
  );
};

export const AdminWithdrawalsTable: React.FC<AdminWithdrawalsTableProps> = ({
  rows,
  totalElements,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  onViewDetail,
  onProcessRequest,
  onCompleteRequest,
  onRejectRequest,
  onFailRequest,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const startItem = totalElements === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs select-none">
      {/* 1. Main Table */}
      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="table-auto sm:table-fixed w-full border-collapse">
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5]/80 text-left">
              <th className="w-12 px-2.5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                #
              </th>
              <th className="w-[18%] px-3.5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Người yêu cầu
              </th>
              <th className="w-[11%] px-3.5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Số tiền rút
              </th>
              <th className="w-[13%] px-3.5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Ngân hàng nhận
              </th>
              <th className="w-[16%] px-3.5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Thông tin tài khoản
              </th>
              <th className="w-[12%] px-3.5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Thời gian yêu cầu
              </th>
              <th className="w-[14%] min-w-[135px] px-3.5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Trạng thái
              </th>
              <th className="w-[160px] min-w-[160px] px-3 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EBE6]">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-4 text-center">
                    <div className="mx-auto h-4 w-4 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-stone-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 rounded bg-stone-200" />
                        <div className="h-3 w-36 rounded bg-stone-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-24 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-4 space-y-1">
                    <div className="h-3.5 w-28 rounded bg-stone-200" />
                    <div className="h-3 w-20 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4 space-y-1">
                    <div className="h-3.5 w-20 rounded bg-stone-200" />
                    <div className="h-3 w-16 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 w-24 rounded-full bg-stone-200" />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="mx-auto h-8 w-16 rounded bg-stone-200" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              // Empty State (Zero Fake Data)
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-[#991B1B]">
                    <Clock className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 font-sans text-base font-semibold text-stone-800">
                    Không có yêu cầu rút tiền nào
                  </h3>
                  <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                    Hiện tại chưa có đơn rút tiền nào phù hợp với bộ lọc đã chọn. Dữ liệu sẽ tự động cập nhật khi có giao dịch mới.
                  </p>
                </td>
              </tr>
            ) : (
              // Real Data Rows
              rows.map((row, index) => {
                const isMenuOpen = activeMenuId === row.id;
                const status = (row.status || '').toUpperCase();

                return (
                  <tr
                    key={row.id}
                    onClick={() => onViewDetail(row)}
                    className="group cursor-pointer hover:bg-[#FAF8F5]/60 transition-colors duration-150"
                  >
                    {/* 1. Index # */}
                    <td className="px-2.5 py-3.5 text-center font-sans text-xs text-stone-400 tabular-nums whitespace-nowrap">
                      {page * pageSize + index + 1}
                    </td>

                    {/* 2. Người yêu cầu */}
                    <td className="px-3.5 py-3.5">
                      <div className="flex items-center gap-3">
                        {row.userAvatarUrl ? (
                          <img
                            src={row.userAvatarUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover border border-stone-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-[#FAF8F5] text-xs font-bold text-stone-700">
                            {row.userInitials}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-stone-900 text-sm group-hover:text-[#991B1B] transition-colors truncate">
                            {row.userName}
                          </span>
                          <span className="text-xs text-stone-500 truncate font-sans">
                            {row.userEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Số tiền rút */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span className="font-sans text-sm font-semibold text-stone-900 tabular-nums tracking-tight whitespace-nowrap">
                        {row.formattedAmount}
                      </span>
                    </td>

                    {/* 4. Ngân hàng nhận */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <BankLogoBadge bankName={row.bankName} code={row.bankBadgeConfig.code} />
                    </td>

                    {/* 5. Thông tin tài khoản */}
                    <td className="px-3.5 py-3.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-sans text-xs font-bold text-stone-800 tracking-wide tabular-nums whitespace-nowrap">
                          <span>{row.formattedAccountNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(row.accountNumber, `acc-${row.id}`, e)}
                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 transition-opacity cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedId === `acc-${row.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
                          {row.accountHolderName}
                        </span>
                      </div>
                    </td>

                    {/* 6. Thời gian yêu cầu */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col whitespace-nowrap">
                        <span className="font-sans text-xs text-stone-700 tabular-nums whitespace-nowrap">
                          {row.datePart}
                        </span>
                        <span className="font-sans text-[11px] text-stone-400 tabular-nums whitespace-nowrap">
                          {row.timePart}
                        </span>
                      </div>
                    </td>

                    {/* 7. Trạng thái */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-tight whitespace-nowrap ${row.statusConfig.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${row.statusConfig.dotColor} shrink-0`} />
                        <span className="whitespace-nowrap">{row.statusConfig.label}</span>
                      </span>
                    </td>

                    {/* 8. Thao tác */}
                    <td
                      className="px-3 py-3.5 text-center whitespace-nowrap relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {/* Xem chi tiết button */}
                        <button
                          type="button"
                          onClick={() => onViewDetail(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-stone-700 hover:border-[#991B1B]/40 hover:text-[#991B1B] hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                          <span className="whitespace-nowrap">Xem chi tiết</span>
                        </button>

                        {/* More dropdown button */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : row.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-500 hover:border-stone-400 hover:text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
                            title="Thao tác nhanh"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-[#E7E5E4] bg-white p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onViewDetail(row);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50"
                                >
                                  <Eye className="h-3.5 w-3.5 text-stone-500" />
                                  <span>Xem chi tiết yêu cầu</span>
                                </button>

                                {status === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onProcessRequest(row);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-blue-700 hover:bg-blue-50"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                                      <span>Tiếp nhận xử lý đơn</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onRejectRequest(row);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50"
                                    >
                                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                      <span>Từ chối yêu cầu</span>
                                    </button>
                                  </>
                                )}

                                {status === 'PROCESSING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onCompleteRequest(row);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Xác nhận đã chuyển tiền</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onFailRequest(row);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-amber-700 hover:bg-amber-50"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                      <span>Báo lỗi chuyển khoản</span>
                                    </button>
                                  </>
                                )}

                                <div className="my-1 border-t border-stone-100" />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    handleCopy(row.accountNumber, `acc-menu-${row.id}`, e);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-50"
                                >
                                  <Copy className="h-3.5 w-3.5 text-stone-400" />
                                  <span>Sao chép số tài khoản</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    handleCopy(String(row.id), `id-menu-${row.id}`, e);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-50"
                                >
                                  <Copy className="h-3.5 w-3.5 text-stone-400" />
                                  <span>Sao chép mã yêu cầu</span>
                                </button>
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

      {/* 2. Pagination Footer matching Sử Ký standard */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F0EBE6] bg-[#FAF8F5]/60 px-4 py-3 select-none">
        {/* Left: Summary text */}
        <div className="text-xs text-stone-500 font-sans">
          Hiển thị <span className="font-semibold text-stone-700 tabular-nums">{startItem}</span>–
          <span className="font-semibold text-stone-700 tabular-nums">{endItem}</span> trong tổng số{' '}
          <span className="font-semibold text-stone-700 tabular-nums">{totalElements}</span> yêu cầu
        </div>

        {/* Right: Page Size & Pagination Buttons */}
        <div className="flex items-center gap-3">
          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(0);
              }}
              className="rounded-lg border border-[#E7E5E4] bg-white py-1 px-2 text-xs font-medium text-stone-700 focus:border-[#991B1B] focus:outline-hidden"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>

          {/* Page number buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = i;
              if (totalPages > 5 && page > 2) {
                pageNum = page - 2 + i;
                if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
              }
              const isActive = page === pageNum;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#991B1B] text-white shadow-xs font-bold'
                      : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            {totalPages > 5 && page < totalPages - 3 && (
              <>
                <span className="px-1 text-xs text-stone-400">...</span>
                <button
                  type="button"
                  onClick={() => onPageChange(totalPages - 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
