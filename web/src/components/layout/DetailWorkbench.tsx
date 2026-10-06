import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface DetailWorkbenchProps {
  title: string;
  subtitle?: React.ReactNode;
  backUrl?: string;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  mainContent: React.ReactNode;
  inspectorContent: React.ReactNode;
  bottomBar?: React.ReactNode;
  className?: string;
}

export const DetailWorkbench: React.FC<DetailWorkbenchProps> = ({
  title,
  subtitle,
  backUrl,
  backLabel = 'Quay lại danh sách',
  badge,
  actions,
  mainContent,
  inspectorContent,
  bottomBar,
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6 pb-12', className)}>
      {/* Workbench Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors mb-2 focus:outline-hidden focus:ring-1 focus:ring-accent rounded-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{backLabel}</span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-ink">
                {title}
              </h1>
              {badge}
            </div>

            {actions && <div className="flex items-center gap-2.5">{actions}</div>}
          </div>

          {subtitle && (
            <div className="mt-1 text-xs text-muted font-normal">{subtitle}</div>
          )}
        </div>
      </div>

      {/* Two-Column Grid: 65-70% Main, 30-35% Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area (8 cols on lg = 66.6%) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {mainContent}
        </div>

        {/* Inspector Panel (4 cols on lg = 33.3%) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
          {inspectorContent}
        </div>
      </div>

      {/* Optional Persistent Decision/Bottom Bar */}
      {bottomBar && (
        <div className="sticky bottom-0 z-10 -mx-6 -mb-12 mt-6 flex items-center justify-between border-t border-border bg-surface/95 backdrop-blur-xs px-6 py-4 shadow-sm">
          {bottomBar}
        </div>
      )}
    </div>
  );
};
