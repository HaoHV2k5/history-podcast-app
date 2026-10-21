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
  isRowSelected?: (item: T) => boolean;
  isRowDisabled?: (item: T) => boolean;
  pagination?: React.ReactNode;
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
  isRowSelected,
  isRowDisabled,
  pagination,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={6} cols={columns.length} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('w-full overflow-hidden rounded-lg border border-border bg-surface', className)}>
        <EmptyState
          embedded
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
            <tr className="border-b border-border bg-[#F7F5F0] text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
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
                      'sticky right-0 bg-[#F7F5F0] shadow-[-6px_0_12px_-4px_rgba(38,37,34,0.08)]',
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
              const isSelected = isRowSelected ? isRowSelected(row) : false;
              const isDisabled = isRowDisabled ? isRowDisabled(row) : false;

              return (
                <tr
                  key={key}
                  onClick={() => !isDisabled && onRowClick && onRowClick(row)}
                  className={cn(
                    'group transition-colors duration-150',
                    isDisabled
                      ? 'opacity-60 cursor-not-allowed bg-surface'
                      : isSelected
                      ? 'bg-[#FAF0F2] hover:bg-[#F5E5E8]'
                      : 'bg-surface hover:bg-[#FAF8F5]',
                    !isDisabled && isClickable && 'cursor-pointer'
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
                          'py-3.5 px-4 text-ink align-middle text-sm font-normal',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.stickyRight &&
                            cn(
                              'sticky right-0 shadow-[-6px_0_12px_-4px_rgba(38,37,34,0.06)] transition-colors duration-150',
                              isSelected
                                ? 'bg-[#FAF0F2] group-hover:bg-[#F5E5E8]'
                                : 'bg-surface group-hover:bg-[#FAF8F5]'
                            ),
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
      {pagination && (
        <div className="border-t border-border bg-surface">
          {pagination}
        </div>
      )}
    </div>
  );
}

