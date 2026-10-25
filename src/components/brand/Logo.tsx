import React from "react";

interface LogoProps {
  variant?: "horizontal" | "compact" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "horizontal", size = "md", className = "" }: LogoProps) {
  // Fluid Cross-Device 3x Enlarged Sizing:
  // - Mobile (<640px): ~h-16 to h-20 (~64-80px) to comfortably fit beside search/hamburger icons without horizontal overflow
  // - Tablet & Desktop (>=640px): ~h-24 to h-32 (~96-128px) in Navbar, and up to h-52 (~208px) in Footer
  const heightClass =
    size === "sm"
      ? "h-12 sm:h-16 md:h-20"
      : size === "lg"
      ? "h-24 sm:h-36 md:h-44 lg:h-52"
      : "h-16 sm:h-22 md:h-28 lg:h-32";

  const iconDimensions =
    size === "sm"
      ? "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
      : size === "lg"
      ? "w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44"
      : "w-16 h-16 sm:w-22 sm:h-22 md:w-28 md:h-28";

  if (variant === "icon") {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-2xl select-none bg-[#00189D] ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={iconDimensions}
          aria-label="eFootball Arena Logo Icon"
        >
          {/* Official eFootball Neon Yellow Emblem */}
          {/* Top Arc */}
          <path
            d="M50 18C34.5 18 21.5 29 18.5 43H81.5C78.5 29 65.5 18 50 18Z"
            fill="#FFFF00"
          />
          {/* Middle Bar */}
          <rect x="11" y="47" width="78" height="9" rx="4.5" fill="#FFFF00" />
          {/* Bottom Arc */}
          <path
            d="M18.5 60C21.5 74 34.5 85 50 85C65.5 85 78.5 74 81.5 60H18.5Z"
            fill="#FFFF00"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* 3x Enlarged Official eFootball ARENA Logo with Responsive Clamping */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="eFootball ARENA — Play. Compete. Belong."
        className={`${heightClass} max-w-[55vw] sm:max-w-none w-auto object-contain rounded-xl shadow-lg hover:scale-[1.01] transition-transform duration-200 drop-shadow-[0_4px_20px_rgba(0,24,157,0.5)]`}
      />
    </div>
  );
}
