import React from "react";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-56 rounded-2xl bg-[#001582]/70 border border-[#002BDC]/40 flex flex-col justify-end p-6 sm:p-8 space-y-3">
        <div className="h-5 w-32 bg-[#FFFF00]/30 rounded-md" />
        <div className="h-8 sm:h-10 w-2/3 max-w-lg bg-white/20 rounded-lg" />
        <div className="h-4 w-1/2 max-w-sm bg-white/10 rounded-md" />
      </div>

      {/* Grid of Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-64 rounded-2xl bg-[#001582]/60 border border-[#002BDC]/30 p-5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-4 w-16 bg-[#FFFF00]/30 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-white/20 rounded-md" />
              <div className="h-3 w-1/2 bg-white/10 rounded" />
            </div>

            <div className="space-y-2 pt-4 border-t border-[#002BDC]/20">
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-9 w-full bg-[#FFFF00]/20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
