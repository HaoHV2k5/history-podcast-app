import React from 'react';
import {
  PenLine,
  Image as ImageIcon,
  Mic,
  Play,
  Check,
} from 'lucide-react';

export type StudioTabId = 'script' | 'storyboard' | 'voices' | 'render';

interface StudioWorkflowStepperProps {
  activeTab: StudioTabId;
  maxUnlockedStep: number;
  hasStoryboard: boolean;
  hasActiveJob?: boolean;
  onSelectTab: (tab: StudioTabId) => void;
  onAttemptLockedStep?: (tab: StudioTabId) => void;
}

interface StepItemConfig {
  id: StudioTabId;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STUDIO_STEPS: StepItemConfig[] = [
  {
    id: 'script',
    stepNumber: 1,
    title: 'Kịch bản',
    subtitle: 'Tạo và chỉnh sửa kịch bản',
    icon: PenLine,
  },
  {
    id: 'storyboard',
    stepNumber: 2,
    title: 'Phân cảnh',
    subtitle: 'Tạo phân cảnh & hình minh họa',
    icon: ImageIcon,
  },
  {
    id: 'voices',
    stepNumber: 3,
    title: 'Giọng đọc',
    subtitle: 'Chọn giọng thuyết minh',
    icon: Mic,
  },
  {
    id: 'render',
    stepNumber: 4,
    title: 'Kết xuất',
    subtitle: 'Xuất video hoặc audio podcast',
    icon: Play,
  },
];

export const StudioWorkflowStepper: React.FC<StudioWorkflowStepperProps> = ({
  activeTab,
  maxUnlockedStep,
  hasStoryboard,
  onSelectTab,
  onAttemptLockedStep,
}) => {
  const effectiveMaxStep = Math.max(maxUnlockedStep, hasStoryboard ? 2 : 1);

  return (
    <div className="relative rounded-2xl border border-[#EAE6DF] bg-white p-3 sm:px-5 sm:py-3.5 md:px-6 md:py-3.5 shadow-2xs overflow-hidden transition-all">
      {/* Subtle warm rosy blush on the left side matching reference design */}
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-r from-[#B83345]/7 via-[#B83345]/2 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-1 lg:gap-2">
        {STUDIO_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeTab === step.id;
          const isUnlocked = step.stepNumber <= effectiveMaxStep;
          const isCompleted =
            step.stepNumber < effectiveMaxStep || (step.id === 'script' && hasStoryboard && !isActive);

          return (
            <React.Fragment key={step.id}>
              {/* Step Interactive Container */}
              <button
                type="button"
                onClick={() => {
                  if (isUnlocked) {
                    onSelectTab(step.id);
                  } else {
                    onAttemptLockedStep?.(step.id);
                  }
                }}
                className={`shrink-0 flex items-center gap-2 sm:gap-2.5 text-left transition-all py-1 px-1 sm:px-1.5 md:px-2 rounded-xl select-none group cursor-pointer ${
                  isUnlocked ? 'hover:bg-[#FAF8F5]/80 active:scale-95' : 'opacity-80 hover:bg-[#FAF8F5]/50'
                }`}
                title={
                  !isUnlocked
                    ? `Nhấp để xem điều kiện mở khóa bước ${step.title}`
                    : `Chuyển tới bước ${step.title}`
                }
              >
                {/* 1. Number Badge Circle */}
                <div
                  className={`flex h-7 w-7 rounded-full items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-2xs ${
                    isActive
                      ? 'bg-accent text-white'
                      : isCompleted
                      ? 'bg-accent text-white'
                      : 'bg-[#A8A29E] text-white'
                  }`}
                  style={{ width: '28px', height: '28px' }}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>

                {/* 2. Soft Icon Rounded Square */}
                <div
                  className={`flex h-7.5 w-7.5 rounded-xl items-center justify-center shrink-0 transition-colors border ${
                    isActive
                      ? 'bg-[#FAF0F1] text-accent border-accent/25'
                      : isCompleted
                      ? 'bg-[#FAF0F1] text-accent border-accent/25'
                      : 'bg-[#F5F4F0] text-[#78716C] border-[#E7E5E4]'
                  }`}
                  style={{ width: '30px', height: '30px' }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* 3. Text Group (Title + Subtitle) */}
                <div className="shrink-0 min-w-0 pr-0.5">
                  <span
                    className={`block font-sans text-xs sm:text-[13px] font-bold leading-tight transition-colors ${
                      isActive ? 'text-[#1C1917]' : isCompleted ? 'text-[#1C1917]' : 'text-[#292524]'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-[#78716C] leading-normal whitespace-nowrap">
                    {step.subtitle}
                  </span>
                </div>
              </button>

              {/* Connecting Line with Arrowhead between steps */}
              {idx < STUDIO_STEPS.length - 1 && (
                <div className="hidden md:flex flex-1 items-center px-1 sm:px-1.5 md:px-2 min-w-[14px] max-w-[85px]">
                  <div className="relative w-full h-[1.5px] bg-[#E7E5E4] flex items-center justify-end">
                    {step.stepNumber < effectiveMaxStep && (
                      <div className="absolute inset-0 bg-accent rounded-full" />
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[72%] bg-accent rounded-l-full" />
                    )}
                    {/* Micro arrowhead at the end pointing towards next step */}
                    <svg
                      className={`h-2.5 w-2.5 -mr-0.5 shrink-0 transition-colors ${
                        step.stepNumber < effectiveMaxStep ? 'text-accent' : 'text-[#D6D3D1]'
                      }`}
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 1 7 5 3 9" />
                    </svg>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};


