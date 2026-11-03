import React from 'react';
import { Trash2, Lock, Shield, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUsersBatchBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkLock: () => void;
  onBulkChangeRole: () => void;
  page: number;
  totalPages: number;
  size: number;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
}

export const AdminUsersBatchBar: React.FC<AdminUsersBatchBarProps> = ({
  selectedCount,
  onBulkDelete,
  onBulkLock,
  onBulkChangeRole,
  page,
  totalPages,
  size,
  onPageChange,
  onSizeChange,
}) => {
  const currentPageDisplay = page + 1;
  const maxPages = Math.max(1, totalPages);

  // Generate page numbers window (e.g. 1 2 3 4 5)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPageDisplay - 2);
    let end = Math.min(maxPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 select-none">
      {/* Left: Batch action buttons when items selected matching mockup */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {selectedCount > 0 ? (
          <>
            <span className="text-xs font-semibold text-stone-800">
              Đã chọn <strong className="text-[#C52227]">{selectedCount}</strong> người dùng
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="h-8 rounded-lg border-[#FECDD3] bg-white text-[#E11D48] hover:bg-[#FFF1F2] hover:text-[#BE123C] text-xs font-medium px-3 shadow-2xs transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              <span>Xóa</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBulkLock}
              className="h-8 rounded-lg border-[#E5E7EB] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium px-3 shadow-2xs transition-colors"
            >
              <Lock className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
              <span>Khóa</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBulkChangeRole}
              className="h-8 rounded-lg border-[#E5E7EB] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium px-3 shadow-2xs transition-colors"
            >
              <Shield className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
              <span>Thay đổi vai trò</span>
            </Button>
          </>
        ) : (
          <span className="text-xs text-stone-400">
            Chọn một hoặc nhiều hàng để thực hiện tác vụ hàng loạt.
          </span>
        )}
      </div>

      {/* Right: Page Size Select + Pagination Buttons matching mockup */}
      <div className="flex items-center gap-3">
        {/* Page size dropdown: Hiển thị 10 / trang */}
        <div className="relative">
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="h-8 appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-7 text-xs text-stone-700 font-medium focus:border-[#C52227] focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value={10}>Hiển thị 10 / trang</option>
            <option value={20}>Hiển thị 20 / trang</option>
            <option value={50}>Hiển thị 50 / trang</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        </div>

        {/* Pagination arrows and numbers: < 1 2 3 4 5 > */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs shadow-2xs"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers().map((num) => {
            const isActive = num === currentPageDisplay;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onPageChange(num - 1)}
                className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#C52227] text-white shadow-xs'
                    : 'border border-[#E5E7EB] bg-white text-stone-700 hover:bg-stone-50 shadow-2xs'
                }`}
              >
                {num}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= maxPages - 1}
            onClick={() => onPageChange(Math.min(maxPages - 1, page + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs shadow-2xs"
            aria-label="Trang tiếp theo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

