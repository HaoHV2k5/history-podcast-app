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

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-start gap-3 select-none cursor-pointer group py-1',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
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
              'w-5 h-5 rounded border border-border bg-canvas flex items-center justify-center transition-colors',
              'group-hover:border-ink-muted group-focus-within:ring-2 group-focus-within:ring-accent group-focus-within:ring-offset-1',
              checked && 'bg-accent border-accent text-white group-hover:bg-accent-hover'
            )}
          >
            {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-ink leading-5">{label}</span>}
            {description && <span className="text-xs text-ink-muted leading-4 mt-0.5">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
