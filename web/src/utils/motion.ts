import { gsap } from 'gsap';

/**
 * Checks whether the client environment requests reduced motion (WCAG 2.3.3).
 */
export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Shared motion configuration constants adhering to Sử Ký's editorial aesthetic.
 */
export const MOTION_CONFIG = {
  ease: 'power2.out',
  duration: {
    loginForm: 0.45,
    loginEditorial: 0.5,
    stagger: 0.08,
    dashboardCards: 0.38,
    studioStep: 0.22,
  },
  distance: {
    sm: 6,
    md: 8,
    lg: 12,
  },
} as const;

/**
 * Helper to safely create an entrance animation within a React component.
 * If prefers-reduced-motion is enabled, instantly applies the terminal state without motion.
 *
 * @param containerRef React ref to the parent container
 * @param buildTimeline Callback function defining the GSAP tweens
 * @returns GSAP Context cleanup function
 */
export const createSafeMotionContext = (
  scope: HTMLElement | React.RefObject<HTMLElement | null>,
  buildTimeline: () => void
): (() => void) => {
  const element = 'current' in scope ? scope.current : scope;
  if (!element) return () => {};

  if (isReducedMotion()) {
    // Instantly reveal all potential motion targets in terminal state
    gsap.set(element.querySelectorAll('[data-motion-target]'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform,opacity',
    });
    return () => {};
  }

  const ctx = gsap.context(() => {
    buildTimeline();
  }, element);

  return () => ctx.revert();
};
