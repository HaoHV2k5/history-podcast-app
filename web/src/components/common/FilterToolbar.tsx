import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface FilterToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  debounceMs?: number;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchPlaceholder = 'Tìm kiếm...',
  searchValue = '',
  onSearchChange,
  debounceMs = 350,
  filters,
  actions,
  onReset,
  showReset = false,
  className,
}) => {
  const [internalSearch, setInternalSearch] = useState(searchValue);

  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (internalSearch !== searchValue) {
        onSearchChange(internalSearch);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalSearch, onSearchChange, debounceMs, searchValue]);

  const handleClear = () => {
    setInternalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative w-full max-w-sm">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-muted" />}
              rightIcon={
                internalSearch ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-muted hover:text-ink transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : undefined
              }
              className="bg-surface w-full"
            />
          </div>
        )}

        {filters && <div className="flex flex-wrap items-center gap-2.5">{filters}</div>}

        {showReset && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted hover:text-ink min-h-[44px] px-3 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Đặt lại
          </Button>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
