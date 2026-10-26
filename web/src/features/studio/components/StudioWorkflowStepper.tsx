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
}) => {
  const effectiveMaxStep = Math.max(maxUnlockedStep, hasStoryboard ? 2 : 1);

  return (
    <div className="relative rounded-2xl border border-[#EAE6DF] bg-white p-3.5 sm:px-6 sm:py-4 shadow-2xs overflow-hidden transition-all">
      {/* Subtle warm rosy blush on the left side matching reference design */}
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-r from-[#B83345]/7 via-[#B83345]/2 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-2">
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
                  }
                }}
                disabled={!isUnlocked}
                className={`flex items-center gap-2.5 sm:gap-3 text-left transition-all p-1.5 rounded-xl select-none group ${
                  isUnlocked ? 'cursor-pointer hover:bg-[#FAF8F5]/80' : 'cursor-not-allowed opacity-80'
                }`}
                title={
                  !isUnlocked
                    ? `Hoàn thành bước trước để mở khóa bước ${step.title}`
                    : `Chuyển tới bước ${step.title}`
                }
              >
                {/* 1. Number Badge Circle */}
                <div
                  className={`flex h-7 w-7 sm:h-7.5 sm:w-7.5 min-w-[28px] min-h-[28px] rounded-full items-center justify-center text-xs sm:text-xs font-bold shrink-0 transition-colors shadow-2xs ${
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
                  className={`flex h-8 w-8 min-w-[32px] min-h-[32px] rounded-xl items-center justify-center shrink-0 transition-colors border ${
                    isActive
                      ? 'bg-[#FAF0F1] text-accent border-accent/25'
                      : isCompleted
                      ? 'bg-[#FAF0F1] text-accent border-accent/25'
                      : 'bg-[#F5F4F0] text-[#78716C] border-[#E7E5E4]'
                  }`}
                  style={{ width: '32px', height: '32px' }}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* 3. Text Group (Title + Subtitle) */}
                <div className="min-w-0 pr-1">
                  <span
                    className={`block font-sans text-xs sm:text-[13.5px] font-bold leading-tight transition-colors ${
                      isActive ? 'text-[#1C1917]' : isCompleted ? 'text-[#1C1917]' : 'text-[#292524]'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="block text-[10.5px] sm:text-[11px] text-[#78716C] leading-normal whitespace-nowrap">
                    {step.subtitle}
                  </span>
                </div>
              </button>

              {/* Connecting Line with Arrowhead between steps */}
              {idx < STUDIO_STEPS.length - 1 && (
                <div className="hidden lg:flex flex-1 items-center px-2 sm:px-3 min-w-[36px] max-w-[130px]">
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


