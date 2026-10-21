import * as React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'pending' | 'error' | 'processing' | 'accent';
  size?: 'default' | 'sm';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'default',
  dot = true,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-subtle text-ink border border-border',
    outline: 'bg-transparent text-ink-muted border border-border',
    success: 'bg-status-success-bg text-status-success-text border border-status-success-text/25',
    pending: 'bg-status-pending-bg text-status-pending-text border border-status-pending-text/25',
    error: 'bg-status-error-bg text-status-error-text border border-status-error-text/25',
    processing: 'bg-status-processing-bg text-status-processing-text border border-status-processing-text/25',
    accent: 'bg-accent-soft text-accent border border-accent/25',
  };

  const sizes = {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
  };

  const hasStatusDot = dot && ['success', 'pending', 'processing', 'error'].includes(variant);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full tracking-wide select-none whitespace-nowrap shadow-xs',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {hasStatusDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          {(variant === 'pending' || variant === 'processing') && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-70',
                variant === 'pending' ? 'bg-status-pending-text' : 'bg-status-processing-text'
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              variant === 'success' && 'bg-status-success-text',
              variant === 'pending' && 'bg-status-pending-text',
              variant === 'processing' && 'bg-status-processing-text',
              variant === 'error' && 'bg-status-error-text'
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
