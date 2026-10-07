import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'w-full min-h-[44px] appearance-none px-3.5 pr-10 py-2.5 text-sm bg-canvas text-ink rounded-lg border border-border transition-colors duration-150',
            'focus:outline-none focus:bg-surface focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle',
            error && 'border-status-error-text focus:ring-status-error-text',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-ink-muted" />
      </div>
    );
  }
);
Select.displayName = 'Select';
