import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Không tìm thấy dữ liệu',
  description = 'Hiện chưa có bản ghi nào phù hợp với bộ lọc hoặc tìm kiếm này trong hệ thống.',
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center bg-surface rounded-lg border border-border border-dashed', className)}>
      <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-ink-muted mb-4">
        {icon || <BookOpen className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h3 className="font-serif text-lg font-medium text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
