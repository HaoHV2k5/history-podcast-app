import React from 'react';
import { cn } from '@/utils/cn';
import { TableSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  stickyRight?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  keyExtractor,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={6} cols={columns.length} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border border-border bg-surface shadow-xs',
        className
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-subtle/60 text-xs font-semibold uppercase tracking-wider text-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={cn(
                    'h-11 px-4 text-left font-medium select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.stickyRight &&
                      'sticky right-0 bg-surface-subtle/90 backdrop-blur-xs shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.04)]',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, index) => {
              const key = keyExtractor(row);
              const isClickable = Boolean(onRowClick);

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'group transition-colors duration-150',
                    isClickable
                      ? 'cursor-pointer hover:bg-surface-subtle/50'
                      : 'hover:bg-surface-subtle/25'
                  )}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(row, index)
                      : (row as Record<string, unknown>)[col.key] as React.ReactNode;

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'min-h-[56px] py-3.5 px-4 text-ink align-middle text-sm font-normal',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.stickyRight &&
                            'sticky right-0 bg-surface group-hover:bg-surface-subtle/50 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.04)]',
                          col.className
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
