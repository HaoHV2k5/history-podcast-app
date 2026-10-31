import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface ChannelBrandLogoProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onErrorFallback?: boolean;
}

/**
 * ChannelBrandLogo
 * Renders the channel avatar image or the signature Sử Ký Podcast emblem
 * (warm coral/rose background with vintage microphone and historical typography)
 * matching the exact visual style in the reference design.
 */
export const ChannelBrandLogo: React.FC<ChannelBrandLogoProps> = ({
  avatarUrl,
  name = 'Sử Ký Podcast',
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // If a valid avatarUrl is provided and hasn't errored out, render the image
  if (avatarUrl && !imageError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[#EBE4D8] bg-[#F7EFE9] shrink-0 shadow-2xs select-none',
          size === 'sm' && 'h-12 w-12',
          size === 'md' && 'h-24 w-24 sm:h-28 sm:w-28',
          size === 'lg' && 'h-32 w-32 sm:h-36 sm:w-36',
          size === 'xl' && 'h-40 w-40 sm:h-44 sm:w-44',
          className
        )}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Signature Sử Ký Podcast Default Brand Logo (identical to reference image)
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#EBE4D8] bg-[#EBB4A9] shrink-0 shadow-2xs select-none flex flex-col items-center justify-center p-2 text-center',
        size === 'sm' && 'h-12 w-12',
        size === 'md' && 'h-24 w-24 sm:h-28 sm:w-28',
        size === 'lg' && 'h-32 w-32 sm:h-36 sm:w-36',
        size === 'xl' && 'h-40 w-40 sm:h-44 sm:w-44',
        className
      )}
      aria-label={`${name} avatar`}
    >
      {/* Background radial warmth */}
      <div
        className="absolute inset-0 bg-radial from-white/30 via-transparent to-black/10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Retro Broadcast Microphone SVG Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center text-[#5C1619]">
        <svg
          viewBox="0 0 48 48"
          className={cn(
            'fill-current drop-shadow-xs transition-transform duration-300',
            size === 'sm' && 'h-5 w-5',
            size === 'md' && 'h-10 w-10 sm:h-12 sm:w-12',
            size === 'lg' && 'h-14 w-14',
            size === 'xl' && 'h-16 w-16'
          )}
          aria-hidden="true"
        >
          {/* Microphone capsule */}
          <rect x="18" y="6" width="12" height="20" rx="6" fill="#5C1619" />
          {/* Inner mesh lines */}
          <line x1="21" y1="12" x2="27" y2="12" stroke="#EBB4A9" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="21" y1="16" x2="27" y2="16" stroke="#EBB4A9" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="21" y1="20" x2="27" y2="20" stroke="#EBB4A9" strokeWidth="1.2" strokeLinecap="round" />
          {/* Cradle arc */}
          <path
            d="M13 20C13 26.0751 17.9249 31 24 31C30.0751 31 35 26.0751 35 20"
            stroke="#5C1619"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Stem & Base */}
          <line x1="24" y1="31" x2="24" y2="39" stroke="#5C1619" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M16 41H32" stroke="#5C1619" strokeWidth="2.8" strokeLinecap="round" />
          {/* Soundwave subtle ripples */}
          <path
            d="M9 16C7.5 18.5 7.5 21.5 9 24"
            stroke="#5C1619"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M39 16C40.5 18.5 40.5 21.5 39 24"
            stroke="#5C1619"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>

        {/* Brand Typography */}
        {size !== 'sm' && (
          <div className="mt-1 text-center select-none leading-none">
            <span className="font-serif font-black tracking-wider text-[11px] sm:text-xs text-[#4A1114] uppercase block">
              SỬ KÝ
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-bold tracking-widest text-[#732226] uppercase block mt-0.5">
              PODCAST
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
