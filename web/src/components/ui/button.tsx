import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const variants = {
      primary: 'bg-accent text-white hover:bg-accent-hover shadow-subtle active:scale-[0.99]',
      secondary: 'bg-surface-subtle text-ink hover:bg-surface border border-border shadow-subtle active:scale-[0.99]',
      outline: 'bg-transparent text-ink border border-border hover:bg-surface-subtle hover:border-ink-muted active:scale-[0.99]',
      ghost: 'bg-transparent text-ink hover:bg-surface-subtle active:scale-[0.99]',
      destructive: 'bg-status-error-bg text-status-error-text border border-status-error-text/20 hover:bg-status-error-text hover:text-white active:scale-[0.99]',
    };

    const sizes = {
      default: 'min-h-[44px] px-4 py-2.5 text-sm gap-2',
      sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5',
      lg: 'min-h-[48px] px-6 py-3 text-base gap-2.5',
      icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-2 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
