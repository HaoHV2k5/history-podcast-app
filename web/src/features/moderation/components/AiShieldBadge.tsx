import React from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle } from 'lucide-react';
import { AiShieldTier } from '@/types/moderation';
import { cn } from '@/utils/cn';

interface AiShieldBadgeProps {
  tier?: AiShieldTier | string;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export const AiShieldBadge: React.FC<AiShieldBadgeProps> = ({
  tier,
  label,
  showIcon = true,
  className,
}) => {
  if (!tier) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-subtle px-2 py-0.5 text-xs text-muted">
        Chưa thẩm định
      </span>
    );
  }

  const normalized = tier.toUpperCase();

  switch (normalized) {
    case 'RED_ALERT':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border border-status-error-text/30 bg-status-error-bg px-2.5 py-0.5 text-xs font-medium text-status-error-text',
            className
          )}
        >
          {showIcon && <ShieldAlert className="h-3.5 w-3.5" />}
          <span>{label || 'Báo động đỏ'}</span>
        </span>
      );

    case 'FAIR':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border border-status-pending-text/30 bg-status-pending-bg px-2.5 py-0.5 text-xs font-medium text-status-pending-text',
            className
          )}
        >
          {showIcon && <AlertTriangle className="h-3.5 w-3.5" />}
          <span>{label || 'Cần lưu ý / Khá'}</span>
        </span>
      );

    case 'GOOD':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border border-status-success-text/30 bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text',
            className
          )}
        >
          {showIcon && <ShieldCheck className="h-3.5 w-3.5" />}
          <span>{label || 'Đạt chuẩn / Tốt'}</span>
        </span>
      );

    case 'EXCELLENT':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent',
            className
          )}
        >
          {showIcon && <Shield className="h-3.5 w-3.5" />}
          <span>{label || 'Xuất sắc'}</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-muted',
            className
          )}
        >
          <span>{label || tier}</span>
        </span>
      );
  }
};
