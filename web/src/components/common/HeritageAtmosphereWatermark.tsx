import * as React from 'react';
import { cn } from '@/utils/cn';

interface HeritageAtmosphereWatermarkProps {
  className?: string;
  tag?: string;
  variant?: 'workspace' | 'library' | 'studio' | 'compact';
}

/**
 * Authentic Vietnamese Heritage Vector Watermark
 * Features an authentic mathematical Đông Sơn Bronze Drum solar rosette medallion,
 * sacred geometric concentric rings, archival registration marks, and atmospheric paper illumination.
 * 
 * Replaces blurry, muddy AI-generated raster artwork with dignified, crisp vector craft.
 */
export const HeritageAtmosphereWatermark: React.FC<HeritageAtmosphereWatermarkProps> = ({
  className,
  tag = '✦ ĐẠI VIỆT SỬ KÝ · ATELIER',
  variant = 'workspace',
}) => {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none select-none overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Atmospheric Diffuse Paper Illumination Glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 75% at 88% 28%, rgba(246, 235, 222, 0.75) 0%, rgba(254, 248, 240, 0.35) 50%, transparent 100%), radial-gradient(ellipse 45% 55% at 96% 80%, rgba(243, 226, 224, 0.4) 0%, transparent 70%)',
        }}
      />

      {/* 2. Archival Drafting Calibration Grid / Hairlines */}
      <div className="absolute inset-0 opacity-[0.28]">
        {/* Horizontal registration hairline */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D6CEBF] to-transparent" />
        {/* Subtle right vertical margin guideline */}
        <div className="absolute top-0 bottom-0 right-[28%] w-[1px] bg-gradient-to-b from-transparent via-[#E0D8CB] to-transparent hidden sm:block" />
        
        {/* Top-right corner registration mark */}
        <div className="absolute top-4 right-4 text-[#8C7D70] font-mono text-[9px] tracking-widest flex items-center gap-1.5 opacity-60">
          <span className="text-[12px] leading-none">+</span>
          <span className="uppercase text-[8px] tracking-[0.2em] font-sans">{tag}</span>
        </div>
        {/* Bottom-right corner mark */}
        <div className="absolute bottom-3 right-4 text-[#8C7D70] font-mono text-[10px] leading-none opacity-40">
          +
        </div>
      </div>

      {/* 3. Mathematical Đông Sơn Bronze Drum (Trống Đồng) Vector Medallion */}
      <div
        className={cn(
          'absolute pointer-events-none transition-transform duration-700 ease-out',
          variant === 'workspace' && 'right-[-80px] sm:right-[-40px] md:right-[-10px] top-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] lg:w-[460px] lg:h-[460px]',
          variant === 'library' && 'right-[-70px] sm:right-[-20px] md:right-[20px] top-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]',
          variant === 'studio' && 'right-[-60px] sm:right-[-10px] top-1/2 -translate-y-1/2 w-[360px] h-[360px]',
          variant === 'compact' && 'right-[-40px] top-1/2 -translate-y-1/2 w-[260px] h-[260px]'
        )}
      >
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#8B2635] opacity-[0.065] mix-blend-multiply transform hover:rotate-12 transition-transform duration-1000"
        >
          {/* Central Sun / 14-Point Solar Rays (Mặt trời 14 cánh Đông Sơn) */}
          <circle cx="250" cy="250" r="24" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="250" cy="250" r="10" fill="currentColor" opacity="0.35" />

          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (360 / 14) * i;
            return (
              <g key={`sun-ray-${i}`} transform={`rotate(${angle} 250 250)`}>
                {/* Sharp solar ray */}
                <polygon
                  points="250,172 254,228 246,228"
                  fill="currentColor"
                  opacity="0.75"
                />
                {/* Triangular interstitial flourish */}
                <polygon
                  points="250,224 252,242 248,242"
                  fill="currentColor"
                  opacity="0.4"
                />
              </g>
            );
          })}

          {/* Concentric Decorative Rings */}
          {/* Ring 1: Inner bead ring */}
          <circle cx="250" cy="250" r="82" stroke="currentColor" strokeWidth="1" />
          <circle
            cx="250"
            cy="250"
            r="87"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2.5 5.5"
            opacity="0.8"
          />
          <circle cx="250" cy="250" r="92" stroke="currentColor" strokeWidth="1" />

          {/* Ring 2: Concentric chevron teeth (Răng cưa) */}
          <circle cx="250" cy="250" r="118" stroke="currentColor" strokeWidth="1" />
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (360 / 36) * i;
            return (
              <line
                key={`tooth-${i}`}
                x1="250"
                y1="118"
                x2="250"
                y2="128"
                stroke="currentColor"
                strokeWidth="1.2"
                transform={`rotate(${angle} 250 250)`}
                opacity="0.6"
              />
            );
          })}
          <circle cx="250" cy="250" r="128" stroke="currentColor" strokeWidth="1" />

          {/* Ring 3: Sacred Cranes Orbit (Vành chim Lạc bay ngược chiều kim đồng hồ) */}
          <circle cx="250" cy="250" r="156" stroke="currentColor" strokeWidth="1.2" />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (360 / 6) * i;
            return (
              <g
                key={`crane-${i}`}
                transform={`rotate(${angle} 250 250)`}
                opacity="0.85"
              >
                {/* Stylized Chim Lạc flight path */}
                <path
                  d="M 232 82 C 244 80 258 84 274 76 C 265 84 260 92 248 94 C 240 92 235 88 232 82 Z"
                  fill="currentColor"
                />
                <path
                  d="M 274 76 L 286 70 C 280 77 274 81 270 85 Z"
                  fill="currentColor"
                />
                <circle cx="282" cy="73" r="1" fill="currentColor" />
              </g>
            );
          })}
          <circle cx="250" cy="250" r="192" stroke="currentColor" strokeWidth="1.2" />

          {/* Ring 4: Outer Geometric Diamond Garland */}
          <circle
            cx="250"
            cy="250"
            r="202"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.7"
          />
          <circle cx="250" cy="250" r="216" stroke="currentColor" strokeWidth="1" />
          <circle cx="250" cy="250" r="226" stroke="currentColor" strokeWidth="1.5" />

          {/* Ring 5: Grand Outer Perimeter Radial Beams */}
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = (360 / 72) * i;
            return (
              <line
                key={`outer-tick-${i}`}
                x1="250"
                y1="226"
                x2="250"
                y2={i % 2 === 0 ? "240" : "234"}
                stroke="currentColor"
                strokeWidth="1"
                transform={`rotate(${angle} 250 250)`}
                opacity="0.5"
              />
            );
          })}
          <circle cx="250" cy="250" r="240" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* 4. Left Gradient Fade for Absolute Typography Legibility */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 via-50% to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
