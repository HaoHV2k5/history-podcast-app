import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PaginationBarProps {
  page: number; // 0-indexed
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function PaginationBar({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  className,
}: PaginationBarProps) {
  if (totalElements === 0) return null;

  const start = page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-border select-none ${className || ''}`}>
      <div className="text-xs text-ink-muted tabular-nums">
        Hiển thị <span className="font-semibold text-ink">{start}</span>–<span className="font-semibold text-ink">{end}</span> trong tổng số{' '}
        <span className="font-semibold text-ink">{totalElements}</span> bản ghi
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="h-9 px-2.5 text-xs text-ink"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Trước
        </Button>

        <div className="text-xs px-2 font-medium text-ink tabular-nums">
          Trang {page + 1} / {Math.max(totalPages, 1)}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="h-9 px-2.5 text-xs text-ink"
        >
          Sau
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
