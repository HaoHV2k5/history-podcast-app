import * as React from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full min-h-[96px] px-3.5 py-2.5 text-sm bg-canvas text-ink placeholder:text-ink-muted/70 rounded-lg border border-border transition-colors duration-150',
          'focus:outline-none focus:bg-surface focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle',
          error && 'border-status-error-text focus:ring-status-error-text',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
