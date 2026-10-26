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
      <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-2xl select-none shadow-lg ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/app-icon.png"
          alt="eFootball ARENA Mobile App Icon"
          className={`${iconDimensions} object-cover rounded-2xl drop-shadow-[0_4px_16px_rgba(0,24,157,0.7)]`}
        />
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
