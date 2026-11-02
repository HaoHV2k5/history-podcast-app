import React from 'react';
import {
  FileText,
  Mic,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  SearchX,
} from 'lucide-react';
import { AdminModerationItem } from '@/types/moderation';
import { AdminAiShieldAssessment } from './AdminAiShieldAssessment';
import {
  getDecisionBadgeConfig,
  formatStackedDateTime,
  formatVideoDuration,
  cleanMarkdownTitle,
  resolveModerationRowThumbnail,
} from '../moderationLogic';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import { cn } from '@/utils/cn';

interface AdminModerationTableProps {
  items: AdminModerationItem[];
  isLoading?: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onViewDetail: (item: AdminModerationItem) => void;
  onQuickApprove: (item: AdminModerationItem) => void;
  onQuickReject: (item: AdminModerationItem) => void;
  // Pagination
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
  onClearFilters?: () => void;
}

export const AdminModerationTable: React.FC<AdminModerationTableProps> = ({
  items,
  isLoading = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetail,
  onQuickApprove,
  onQuickReject,
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  onSizeChange,
  onClearFilters,
}) => {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.reviewId));
  const someSelected = items.some((i) => selectedIds.includes(i.reviewId)) && !allSelected;

  const fromItem = totalElements === 0 ? 0 : page * size + 1;
  const toItem = Math.min((page + 1) * size, totalElements);

  const copyReviewId = (id: number) => {
    navigator.clipboard?.writeText(String(id));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EBE4D8] bg-white shadow-2xs">
      {/* Table Container - Fits cleanly with zero horizontal scrollbar */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse table-auto">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[#E0DDD7] bg-[#FAF8F5]/80 text-[11px] sm:text-xs font-semibold text-[#57534E] select-none whitespace-nowrap">
              <th className="py-3 pl-3.5 sm:pl-4 pr-1 w-9 sm:w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="Chọn tất cả video"
                  className="h-4 w-4 rounded border-[#D6D0C4] text-[#991B1B] focus:ring-[#991B1B] cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 sm:px-3">Nội dung & Thông tin</th>
              <th className="py-3 px-2 sm:px-2.5 w-[145px] xl:w-[170px]">Kênh & Tác giả</th>
              <th className="py-3 px-2 sm:px-2.5 w-[155px] xl:w-[180px]">Thẩm định AI Shield</th>
              <th className="py-3 px-2 sm:px-2.5 w-[120px] whitespace-nowrap">Trạng thái duyệt</th>
              <th className="py-3 px-2 sm:px-2.5 w-[85px] whitespace-nowrap">Thời gian gửi</th>
              <th className="py-3 pl-2 pr-3.5 sm:pr-4 text-right w-[130px] whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E0DDD7]/60 text-xs text-[#1C1917]">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: Math.min(size, 5) }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 pl-3.5 sm:pl-4 pr-1 w-9 sm:w-10">
                    <div className="h-4 w-4 rounded bg-stone-100" />
                  </td>
                  <td className="py-3 px-2 sm:px-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="h-12 w-20 rounded-lg bg-stone-100 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-3/4 rounded bg-stone-100" />
                        <div className="h-2.5 w-1/2 rounded bg-stone-100" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-2.5 w-[145px] xl:w-[170px]">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-stone-100 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3 w-16 rounded bg-stone-100" />
                        <div className="h-2.5 w-20 rounded bg-stone-100" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-2.5 w-[155px] xl:w-[180px]">
                    <div className="h-4 w-24 rounded-full bg-stone-100 mb-1" />
                    <div className="h-2.5 w-20 rounded bg-stone-100" />
                  </td>
                  <td className="py-3 px-2 sm:px-2.5 w-[120px] whitespace-nowrap">
                    <div className="h-5 w-20 rounded-full bg-stone-100" />
                  </td>
                  <td className="py-3 px-2 sm:px-2.5 w-[85px] whitespace-nowrap">
                    <div className="h-3 w-10 rounded bg-stone-100 mb-1" />
                    <div className="h-2.5 w-14 rounded bg-stone-100" />
                  </td>
                  <td className="py-3 pl-2 pr-3.5 sm:pr-4 text-right w-[130px] whitespace-nowrap">
                    <div className="h-7 w-20 rounded-lg bg-stone-100 ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Pure Empty State (Zero Fake Data)
              <tr>
                <td colSpan={7} className="py-14 px-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2EB] border border-[#E0DDD7] text-[#78716C] mb-3">
                    <SearchX className="h-7 w-7 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#1C1917]">
                    Hàng đợi kiểm duyệt trống
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
                    Hiện không có video nào cần kiểm duyệt hoặc khớp với bộ lọc hiện tại.
                  </p>
                  {onClearFilters && (
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#E0DDD7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C1917] shadow-2xs hover:bg-[#F5F2EB] transition-colors cursor-pointer"
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              // Data Rows
              items.map((item, idx) => {
                const isSelected = selectedIds.includes(item.reviewId);
                const decisionBadge = getDecisionBadgeConfig(item.decision);
                const timeStacked = formatStackedDateTime(item.createdAt);
                const displayTitle = cleanMarkdownTitle(item.title);
                const thumbnailSrc = resolveModerationRowThumbnail(
                  item.title,
                  item.optimizedUrl || item.fileUrl,
                  idx
                );

                return (
                  <tr
                    key={item.reviewId || idx}
                    onClick={() => onViewDetail(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onViewDetail(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Xem chi tiết kiểm duyệt video: ${displayTitle}`}
                    className={cn(
                      'group transition-colors duration-150 hover:bg-[#F9F6F0] select-none cursor-pointer focus:outline-none focus:bg-[#FAF7F2]',
                      isSelected && 'bg-rose-50/40'
                    )}
                  >
                    {/* 1. Checkbox */}
                    <td
                      className="py-3.5 pl-4 sm:pl-5 pr-2 w-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelect(item.reviewId);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Chọn video ${displayTitle}`}
                        className="h-4 w-4 rounded border-[#D6D0C4] text-[#991B1B] focus:ring-[#991B1B] cursor-pointer"
                      />
                    </td>

                    {/* 2. Nội dung & Thông tin */}
                    <td className="py-3 px-2 sm:px-3">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Thumbnail with duration badge */}
                        <div
                          className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E0DDD7] bg-[#EFEAE3] shadow-2xs group-hover:border-[#991B1B]/40 transition-colors"
                        >
                          <img
                            src={thumbnailSrc}
                            alt={displayTitle}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const fallbacks = [
                                '/assets/studio/topic-bach-dang-1288.png',
                                '/assets/studio/topic-lam-son.png',
                                '/assets/studio/topic-thang-long-banner.png',
                                '/assets/studio/topic-dien-hong.png',
                                '/assets/studio/topic-nhu-nguyet.png',
                              ];
                              (e.target as HTMLImageElement).src = fallbacks[idx % fallbacks.length];
                            }}
                          />
                          {item.durationSeconds && item.durationSeconds > 0 ? (
                            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-mono font-medium text-white shadow-xs">
                              {formatVideoDuration(item.durationSeconds)}
                            </span>
                          ) : null}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex flex-col min-w-0 pr-1">
                          <span
                            className="text-left font-bold text-xs sm:text-[13px] text-[#1C1917] group-hover:text-[#991B1B] line-clamp-1 leading-snug transition-colors"
                            title={displayTitle}
                          >
                            {displayTitle}
                          </span>
                          <span className="text-[10.5px] text-[#78716C] mt-0.5 truncate">
                            #{item.reviewId} • Lịch sử •{' '}
                            {formatVideoDuration(item.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Kênh & Tác giả */}
                    <td className="py-3 px-2 sm:px-2.5 w-[145px] xl:w-[170px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 border border-rose-200/60 text-rose-600">
                          <Mic className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-semibold text-xs text-[#1C1917] truncate max-w-[105px] xl:max-w-[135px] block"
                            title={item.channelName}
                          >
                            {item.channelName || 'Chưa đặt kênh'}
                          </span>
                          <span
                            className="text-[10.5px] text-[#78716C] font-mono truncate max-w-[105px] xl:max-w-[135px] block"
                            title={item.creatorEmail}
                          >
                            {item.creatorEmail || 'creator@example.com'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Thẩm định AI Shield */}
                    <td className="py-3 px-2 sm:px-2.5 w-[155px] xl:w-[180px]">
                      <AdminAiShieldAssessment item={item} />
                    </td>

                    {/* 5. Trạng thái duyệt (Whitespace-nowrap guaranteed) */}
                    <td className="py-3 px-2 sm:px-2.5 w-[120px] whitespace-nowrap">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold border shadow-2xs whitespace-nowrap shrink-0',
                          decisionBadge.badgeClasses
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', decisionBadge.dotColor)} />
                        <span className="whitespace-nowrap">{decisionBadge.label}</span>
                      </div>
                    </td>

                    {/* 6. Thời gian gửi (Whitespace-nowrap guaranteed) */}
                    <td className="py-3 px-2 sm:px-2.5 w-[85px] whitespace-nowrap">
                      <div className="flex flex-col font-mono text-[11px] leading-tight">
                        <span className="font-semibold text-[#1C1917]">{timeStacked.time}</span>
                        <span className="text-[10px] text-[#78716C] mt-0.5">{timeStacked.date}</span>
                      </div>
                    </td>

                    {/* 7. Thao tác (Single line button guaranteed) */}
                    <td
                      className="py-3 pl-2 pr-3.5 sm:pr-4 text-right w-[130px] whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#E0DDD7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1C1917] shadow-2xs hover:border-[#991B1B] hover:text-[#991B1B] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#57534E]" />
                          <span className="whitespace-nowrap">Xem chi tiết</span>
                        </button>

                        {/* More Menu Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#78716C] hover:bg-[#F5F2EB] hover:text-[#1C1917] transition-colors cursor-pointer shrink-0"
                              aria-label="Thao tác bổ sung"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem onClick={() => onViewDetail(item)}>
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />
                              <span>Mở thẩm định đầy đủ</span>
                            </DropdownMenuItem>

                            {item.decision === 'PENDING' && (
                              <>
                                <DropdownMenuItem onClick={() => onQuickApprove(item)}>
                                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                  <span>Phê duyệt nhanh</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onQuickReject(item)}>
                                  <XCircle className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                  <span>Từ chối video</span>
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copyReviewId(item.reviewId)}>
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              <span>Sao chép ID #{item.reviewId}</span>
                            </DropdownMenuItem>
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

      {/* Table Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E0DDD7] bg-[#FAF8F5]/80 px-4 sm:px-6 py-3 text-xs text-[#57534E] select-none">
        {/* Left: Summary text */}
        <div>
          <span>
            Hiển thị{' '}
            <strong className="text-[#1C1917]">
              {fromItem}–{toItem}
            </strong>{' '}
            trong tổng số <strong className="text-[#1C1917]">{totalElements}</strong> video
          </span>
        </div>

        {/* Right: Page size & Page numbers */}
        <div className="flex items-center gap-3">
          {/* Page Size Select */}
          <div className="relative">
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="h-8 appearance-none rounded-lg border border-[#E0DDD7] bg-white pl-2.5 pr-7 text-xs font-medium text-[#1C1917] shadow-2xs focus:border-[#991B1B] focus:outline-none cursor-pointer"
            >
              <option value={5}>Hiển thị 5 / trang</option>
              <option value={10}>Hiển thị 10 / trang</option>
              <option value={20}>Hiển thị 20 / trang</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#78716C]" />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0DDD7] bg-white text-[#57534E] shadow-2xs hover:bg-[#F5F2EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Dynamic Page Buttons */}
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
              const pageNum = idx;
              const isCurrent = page === pageNum;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer',
                    isCurrent
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'border border-[#E0DDD7] bg-white text-[#1C1917] hover:bg-[#F5F2EB]'
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0DDD7] bg-white text-[#57534E] shadow-2xs hover:bg-[#F5F2EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Trang tiếp"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
