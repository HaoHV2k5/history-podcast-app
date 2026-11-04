import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // seconds per cycle
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className,
  speed = 14,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && measureRef.current) {
        const textWidth = measureRef.current.offsetWidth;
        const containerWidth = containerRef.current.clientWidth;
        // Trigger marquee if text width strictly exceeds visible container width
        setIsOverflowing(textWidth > containerWidth);
      }
    };

    checkOverflow();

    // Re-check when fonts are loaded
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(checkOverflow);
    }

    // Observe container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      resizeObserver?.disconnect();
    };
  }, [text]);

  const animationStyle: React.CSSProperties = {
    animation: `marquee-scroll ${speed}s linear infinite`,
    animationPlayState: isHovered ? 'paused' : 'running',
    WebkitAnimation: `marquee-scroll ${speed}s linear infinite`,
    WebkitAnimationPlayState: isHovered ? 'paused' : 'running',
  };

  return (
    <div
      ref={containerRef}
      data-ui="marquee-wrapper"
      title={text}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('relative overflow-hidden whitespace-nowrap select-none', className)}
    >
      {/* Hidden measuring span matching exact font styling to detect overflow */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute pointer-events-none left-0 top-0 whitespace-nowrap"
      >
        {text}
      </span>

      {!isOverflowing ? (
        <span className="inline-block truncate w-full">{text}</span>
      ) : (
        <div
          data-ui="marquee-ticker"
          className="flex overflow-hidden"
        >
          {/* Primary loop item */}
          <div
            className="inline-flex shrink-0 items-center gap-4 pr-4 cursor-default"
            style={animationStyle}
          >
            <span>{text}</span>
            <span aria-hidden="true" className="opacity-40 font-normal">
              •
            </span>
          </div>

          {/* Second loop item */}
          <div
            aria-hidden="true"
            className="inline-flex shrink-0 items-center gap-4 pr-4 cursor-default"
            style={animationStyle}
          >
            <span>{text}</span>
            <span className="opacity-40 font-normal">•</span>
          </div>
        </div>
      )}
    </div>
  );
};
