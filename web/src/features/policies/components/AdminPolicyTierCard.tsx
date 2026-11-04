import React, { useId, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Star,
  Pencil,
  ChevronDown,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { cn } from '@/utils/cn';
import {
  PolicyCardDraft,
  POLICY_ACTION_OPTIONS,
  MAX_POLICY_DESCRIPTION_LENGTH,
  getTierThemeMeta,
  resolveActionTriggerLabel,
  togglePolicyActionType,
  validatePolicyDraft,
  formatScoreValue,
} from '../policiesLogic';

interface AdminPolicyTierCardProps {
  draft: PolicyCardDraft;
  isDirty: boolean;
  isSaving: boolean;
  saveFeedback?: { type: 'success' | 'error'; message: string } | null;
  onChange: (nextDraft: PolicyCardDraft) => void;
  onSave: (draft: PolicyCardDraft) => void;
}

export const AdminPolicyTierCard: React.FC<AdminPolicyTierCardProps> = ({
  draft,
  isDirty,
  isSaving,
  saveFeedback,
  onChange,
  onSave,
}) => {
  const baseId = useId();
  const minInputId = `${baseId}-min-score`;
  const maxInputId = `${baseId}-max-score`;
  const actionLabelId = `${baseId}-action-label`;
  const descInputId = `${baseId}-description`;
  const scoreErrorId = `${baseId}-score-error`;

  const [hasTouchedScore, setHasTouchedScore] = useState(false);

  const theme = getTierThemeMeta(draft.tier);
  const validation = validatePolicyDraft(draft);
  const showScoreError = Boolean(validation.scoreError && hasTouchedScore);

  const renderTierIcon = () => {
    switch (theme.iconType) {
      case 'shield-alert':
        return <ShieldAlert className="h-5 w-5" />;
      case 'alert-triangle':
        return <AlertTriangle className="h-5 w-5" />;
      case 'shield-check':
        return <ShieldCheck className="h-5 w-5" />;
      case 'star':
        return <Star className="h-5 w-5" />;
      default:
        return <ShieldAlert className="h-5 w-5" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasTouchedScore(true);
    if (!validation.isValid) {
      return;
    }
    onSave(draft);
  };

  const triggerText = resolveActionTriggerLabel(draft.actionType);
  const isUnsetAction = triggerText === 'Chưa định nghĩa hành động';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        'rounded-2xl border border-[#EAE5DF] bg-white p-2.5 sm:p-3 shadow-[0_1px_3px_rgba(28,25,23,0.03)] flex flex-col justify-between font-sans transition-opacity duration-200',
        !draft.isActive && 'opacity-85'
      )}
    >
      <div>
        {/* 1. Tier Header Banner */}
        <div
          className={cn(
            'rounded-xl px-4 py-3.5 flex items-center justify-between gap-3',
            theme.headerBg
          )}
        >
          {/* Left: Icon + Title + Subtitle */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={cn(
                'h-10 w-10 rounded-full border flex items-center justify-center shrink-0',
                theme.iconCircleClass
              )}
              aria-hidden="true"
            >
              {renderTierIcon()}
            </div>
            <div className="min-w-0">
              <h3
                className={cn(
                  'text-[15px] sm:text-base font-bold leading-tight truncate',
                  theme.titleColorClass
                )}
                title={draft.label}
              >
                {draft.label}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 truncate" title={theme.subtitle}>
                {theme.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Score Range Badge + Active Toggle Switch */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-bold tabular-nums whitespace-nowrap shrink-0',
                theme.rangePillClass
              )}
            >
              {formatScoreValue(draft.minScore)}% - {formatScoreValue(draft.maxScore)}%
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={draft.isActive}
              aria-label={`Kích hoạt phân tầng ${draft.label}`}
              onClick={() => onChange({ ...draft, isActive: !draft.isActive })}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] focus-visible:ring-offset-1',
                draft.isActive ? theme.switchActiveClass : 'bg-stone-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-out',
                  draft.isActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </div>

        {/* 2. Form Fields */}
        <div className="px-3 sm:px-3.5 pt-4 pb-2 space-y-4">
          {/* Row 1: Ngưỡng điểm */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label
                htmlFor={minInputId}
                className="w-36 shrink-0 text-xs font-semibold text-stone-700"
              >
                Ngưỡng điểm
              </label>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Min Score Input */}
                <div
                  className={cn(
                    'inline-flex items-center rounded-lg border bg-white overflow-hidden transition-colors',
                    showScoreError
                      ? 'border-rose-400 focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-rose-500/15'
                      : 'border-[#E7E5E4] focus-within:border-[#991B1B] focus-within:ring-2 focus-within:ring-[#991B1B]/15'
                  )}
                >
                  <input
                    id={minInputId}
                    name={`minScore-${draft.tier}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    step="1"
                    value={Number.isNaN(draft.minScore) ? '' : draft.minScore}
                    onBlur={() => setHasTouchedScore(true)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw === '' ? 0 : Number(raw);
                      onChange({
                        ...draft,
                        minScore: Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed)),
                      });
                    }}
                    aria-label={`Ngưỡng điểm tối thiểu ${draft.label}`}
                    aria-invalid={showScoreError}
                    aria-describedby={showScoreError ? scoreErrorId : undefined}
                    className="w-14 sm:w-16 px-3 py-1.5 text-xs font-medium text-stone-800 tabular-nums bg-transparent focus:outline-none"
                  />
                  <span className="bg-[#F7F5F2] border-l border-[#E7E5E4] px-2.5 py-1.5 text-xs text-stone-500 font-medium select-none">
                    %
                  </span>
                </div>

                <span className="text-stone-400 font-medium select-none">-</span>

                {/* Max Score Input */}
                <div
                  className={cn(
                    'inline-flex items-center rounded-lg border bg-white overflow-hidden transition-colors',
                    showScoreError
                      ? 'border-rose-400 focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-rose-500/15'
                      : 'border-[#E7E5E4] focus-within:border-[#991B1B] focus-within:ring-2 focus-within:ring-[#991B1B]/15'
                  )}
                >
                  <input
                    id={maxInputId}
                    name={`maxScore-${draft.tier}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    step="1"
                    value={Number.isNaN(draft.maxScore) ? '' : draft.maxScore}
                    onBlur={() => setHasTouchedScore(true)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw === '' ? 0 : Number(raw);
                      onChange({
                        ...draft,
                        maxScore: Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed)),
                      });
                    }}
                    aria-label={`Ngưỡng điểm tối đa ${draft.label}`}
                    aria-invalid={showScoreError}
                    aria-describedby={showScoreError ? scoreErrorId : undefined}
                    className="w-14 sm:w-16 px-3 py-1.5 text-xs font-medium text-stone-800 tabular-nums bg-transparent focus:outline-none"
                  />
                  <span className="bg-[#F7F5F2] border-l border-[#E7E5E4] px-2.5 py-1.5 text-xs text-stone-500 font-medium select-none">
                    %
                  </span>
                </div>
              </div>
            </div>

            {showScoreError && (
              <p
                id={scoreErrorId}
                role="alert"
                className="text-[11px] font-medium text-rose-600 sm:pl-40 flex items-center gap-1"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{validation.scoreError}</span>
              </p>
            )}
          </div>

          {/* Row 2: Hành động quy định (Radix Portal Dropdown with Toggle-Off) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span
              id={actionLabelId}
              className="w-36 shrink-0 text-xs font-semibold text-stone-700"
            >
              Hành động quy định
            </span>

            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-labelledby={actionLabelId}
                    className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-2 min-h-[38px] text-xs flex items-center justify-between gap-2 hover:border-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]/15 focus-visible:border-[#991B1B] transition-colors cursor-pointer"
                  >
                    <span
                      className={cn(
                        'truncate text-left',
                        isUnsetAction ? 'text-stone-500' : 'text-stone-800 font-medium'
                      )}
                    >
                      {triggerText}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[260px] z-[999] rounded-xl border border-[#E7E5E4] bg-white p-1.5 shadow-lg font-sans duration-200 ease-out"
                >
                  {POLICY_ACTION_OPTIONS.map((opt) => {
                    const isSelected =
                      (draft.actionType || 'MANUAL_REVIEW').toUpperCase() ===
                      opt.value.toUpperCase();
                    return (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => {
                          const nextAction = togglePolicyActionType(draft.actionType, opt.value);
                          onChange({ ...draft, actionType: nextAction });
                        }}
                        className={cn(
                          'flex items-start justify-between gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-[#FDF2F3] text-[#991B1B] font-semibold'
                            : 'text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="block truncate">{opt.menuLabel}</span>
                          <span className="block text-[11px] text-stone-400 font-normal mt-0.5 leading-snug">
                            {opt.description}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#991B1B] shrink-0 mt-0.5" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <div className="mt-1 border-t border-stone-100 px-3 py-2 text-[11px] text-stone-400 leading-relaxed">
                    Backend hiện chỉ thực thi luồng duyệt thủ công (<code className="font-sans font-semibold text-stone-500">MANUAL_REVIEW</code>); chưa hỗ trợ tự động duyệt hoặc chặn xuất bản.
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Row 3: Mô tả tiêu chuẩn */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <label
              htmlFor={descInputId}
              className="w-36 shrink-0 text-xs font-semibold text-stone-700 sm:pt-2.5"
            >
              Mô tả tiêu chuẩn
            </label>

            <div className="flex-1 min-w-0 relative rounded-xl border border-[#E7E5E4] bg-white focus-within:border-[#991B1B] focus-within:ring-2 focus-within:ring-[#991B1B]/15 transition-colors">
              <textarea
                id={descInputId}
                name={`description-${draft.tier}`}
                rows={2}
                maxLength={MAX_POLICY_DESCRIPTION_LENGTH}
                value={draft.description}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    description: e.target.value.slice(0, MAX_POLICY_DESCRIPTION_LENGTH),
                  })
                }
                placeholder="Nhập mô tả tiêu chuẩn phân tầng..."
                className="w-full px-3.5 pt-2.5 pb-6 text-xs text-stone-700 leading-relaxed bg-transparent resize-none focus:outline-none overflow-wrap-anywhere"
              />
              <span
                className="absolute bottom-2 right-3 text-[11px] font-sans tabular-nums text-stone-400 select-none pointer-events-none"
                aria-live="polite"
              >
                {draft.description.length}/{MAX_POLICY_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Card Footer: Feedback + Save Button */}
      <div className="px-3 sm:px-3.5 pt-2 pb-1 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {saveFeedback ? (
            <div
              role="status"
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-medium truncate max-w-full',
                saveFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
              )}
            >
              {saveFeedback.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              )}
              <span className="truncate">{saveFeedback.message}</span>
            </div>
          ) : isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Có thay đổi chưa lưu</span>
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 min-h-[36px] text-xs font-semibold active:scale-[0.97] transition-[transform,background-color,border-color,opacity] duration-150 ease-out cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]',
            theme.saveBtnClass
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              <span>Lưu thay đổi</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

