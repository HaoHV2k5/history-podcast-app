import * as React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'pending' | 'error' | 'processing' | 'accent';
  size?: 'default' | 'sm';
}

export function Badge({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-subtle text-ink border border-border',
    outline: 'bg-transparent text-ink-muted border border-border',
    success: 'bg-status-success-bg text-status-success-text border border-status-success-text/20',
    pending: 'bg-status-pending-bg text-status-pending-text border border-status-pending-text/20',
    error: 'bg-status-error-bg text-status-error-text border border-status-error-text/20',
    processing: 'bg-status-processing-bg text-status-processing-text border border-status-processing-text/20',
    accent: 'bg-accent-soft text-accent border border-accent/20',
  };

  const sizes = {
    default: 'px-2 py-0.5 text-xs',
    sm: 'px-1.5 py-0.2 text-[10px]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
