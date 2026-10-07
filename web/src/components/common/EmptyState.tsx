import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  embedded?: boolean;
  className?: string;
}

export function EmptyState({
  title = 'Không tìm thấy dữ liệu',
  description = 'Hiện chưa có bản ghi nào phù hợp với bộ lọc hoặc tìm kiếm này trong hệ thống.',
  action,
  icon,
  embedded = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-6',
        !embedded && 'bg-surface rounded-lg border border-border',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-ink-muted mb-3.5 border border-border/70">
        {icon || <BookOpen className="w-5 h-5 text-accent stroke-[1.75]" />}
      </div>
      <h3 className="font-serif text-base font-semibold text-ink mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-ink-muted max-w-md mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

