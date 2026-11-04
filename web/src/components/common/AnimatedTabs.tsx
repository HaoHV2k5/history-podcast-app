import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/utils/cn';
import { isReducedMotion } from '@/utils/motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  description?: string;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

/**
 * AnimatedTabs
 * Provides smooth GSAP-driven sliding indicator between tabs with full keyboard accessibility,
 * adhering to tasteskill v2 and ui-ux-pro-max guidelines (no lag, 44px hit targets, reduced-motion safe).
 */
export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = 'underline',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isFirstRender = useRef(true);

  // Measure and animate sliding indicator
  useLayoutEffect(() => {
    const activeEl = tabRefs.current.get(activeTab);
    const container = tabListRef.current;
    const indicator = indicatorRef.current;

    if (!activeEl || !container || !indicator) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const targetLeft = activeRect.left - containerRect.left + container.scrollLeft;
    const targetWidth = activeRect.width;

    if (isFirstRender.current || isReducedMotion()) {
      // Immediate snap on mount or reduced motion
      gsap.set(indicator, {
        x: targetLeft,
        width: targetWidth,
        opacity: 1,
      });
      isFirstRender.current = false;
    } else {
      gsap.to(indicator, {
        x: targetLeft,
        width: targetWidth,
        opacity: 1,
        duration: 0.28,
        ease: 'power2.out',
      });
    }
  }, [activeTab]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      const activeEl = tabRefs.current.get(activeTab);
      const container = tabListRef.current;
      const indicator = indicatorRef.current;

      if (!activeEl || !container || !indicator) return;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      gsap.set(indicator, {
        x: activeRect.left - containerRect.left + container.scrollLeft,
        width: activeRect.width,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  return (
    <div className={cn('relative w-full', className)}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Điều hướng quản lý kênh"
        className={cn(
          'relative flex items-center gap-1 overflow-x-auto scrollbar-none select-none',
          variant === 'underline' && 'border-b border-[#EBE4D8]'
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group relative inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer shrink-0 rounded-t-lg',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]/30',
                isActive
                  ? 'text-[#A31D24]'
                  : 'text-[#786D66] hover:text-[#1F1A19] hover:bg-[#FAF8F5]/60'
              )}
            >
              {tab.icon && (
                <span
                  className={cn(
                    'transition-colors duration-150',
                    isActive ? 'text-[#A31D24]' : 'text-[#8C827A] group-hover:text-[#1F1A19]'
                  )}
                  aria-hidden="true"
                >
                  {tab.icon}
                </span>
              )}

              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-mono font-bold leading-none transition-colors',
                    isActive
                      ? 'bg-[#FDF2F2] text-[#A31D24]'
                      : 'bg-[#F3EFEA] text-[#786D66] group-hover:bg-[#EBE4D8]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Sliding Bottom Indicator (GSAP Controlled) */}
        {variant === 'underline' && (
          <div
            ref={indicatorRef}
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[2.5px] bg-[#A31D24] rounded-t-full pointer-events-none opacity-0"
            style={{ willChange: 'transform, width' }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Hook to animate tab panel switching with GSAP
 */
export const useTabContentAnimation = (
  containerRef: React.RefObject<HTMLElement | null>,
  activeTab: string
) => {
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || isReducedMotion()) return;

    const targets = el.querySelectorAll('[data-tab-content]');
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    }, el);

    return () => ctx.revert();
  }, [containerRef, activeTab]);
};
