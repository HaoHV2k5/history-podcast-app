import * as React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-ink-muted/70 rounded-lg border border-border transition-colors duration-150',
            'focus:outline-none focus:bg-surface focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle',
            error && 'border-status-error-text focus:ring-status-error-text',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-ink-muted">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
