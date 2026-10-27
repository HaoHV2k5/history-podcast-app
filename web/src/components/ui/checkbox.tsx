import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, label, description, checked, disabled, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const isMultiline = Boolean(description);

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex select-none cursor-pointer group transition-colors',
          isMultiline ? 'items-start gap-3 py-1' : 'items-center gap-2.5',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className={cn('relative flex items-center justify-center shrink-0', isMultiline && 'mt-0.5')}>
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded border border-border bg-canvas flex items-center justify-center transition-all duration-150',
              'group-hover:border-ink-muted group-focus-within:ring-2 group-focus-within:ring-accent group-focus-within:ring-offset-1',
              checked && 'bg-accent border-accent text-white group-hover:bg-accent-hover shadow-2xs'
            )}
          >
            {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col min-w-0">
            {label && (
              <span className={cn('font-medium text-ink leading-snug', isMultiline ? 'text-sm' : 'text-xs')}>
                {label}
              </span>
            )}
            {description && <span className="text-xs text-ink-muted leading-4 mt-0.5">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
