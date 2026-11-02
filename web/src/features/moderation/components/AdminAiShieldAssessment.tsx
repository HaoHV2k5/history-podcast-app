import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Check } from 'lucide-react';
import { AdminModerationItem } from '@/types/moderation';
import { parseAiShieldAssessment } from '../moderationLogic';
import { cn } from '@/utils/cn';

interface AdminAiShieldAssessmentProps {
  item: Partial<AdminModerationItem>;
  className?: string;
}

export const AdminAiShieldAssessment: React.FC<AdminAiShieldAssessmentProps> = ({
  item,
  className,
}) => {
  const assessment = parseAiShieldAssessment(item);

  return (
    <div className={cn('flex flex-col gap-1 items-start select-none max-w-full', className)}>
      {/* Pill Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold border shadow-2xs transition-colors whitespace-nowrap shrink-0',
          assessment.pillClasses
        )}
      >
        {assessment.iconType === 'check' && <ShieldCheck className="h-3 w-3 shrink-0" />}
        {assessment.iconType === 'alert' && <AlertTriangle className="h-3 w-3 shrink-0" />}
        {assessment.iconType === 'danger' && <ShieldAlert className="h-3 w-3 shrink-0" />}

        <span className="whitespace-nowrap">
          {assessment.label}
          {assessment.scoreFormatted ? ` (${assessment.scoreFormatted})` : ''}
        </span>
      </div>

      {/* Bullet Points */}
      <div className="flex flex-col gap-0.5 text-[10.5px] text-[#57534E] max-w-full">
        {assessment.bulletPoints.map((bullet, idx) => (
          <div key={idx} className="flex items-center gap-1 leading-tight max-w-full">
            {assessment.iconType === 'check' ? (
              <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0 stroke-[2.5]" />
            ) : assessment.iconType === 'danger' ? (
              <span className="h-1 w-1 rounded-full bg-rose-500 shrink-0 ml-0.5 mr-0.5" />
            ) : (
              <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0 ml-0.5 mr-0.5" />
            )}
            <span className="truncate max-w-[150px] xl:max-w-[200px]" title={bullet}>
              {bullet}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
