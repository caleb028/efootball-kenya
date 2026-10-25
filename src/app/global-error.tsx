"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#00189D] text-white min-h-screen flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-[#001582] border-2 border-[#FFFF00]/40 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FF1E27]/20 border border-[#FF1E27] text-[#FF1E27] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded bg-[#FFFF00] text-[#00189D] text-xs font-extrabold uppercase tracking-wider font-mono">
              eFootball ARENA
            </span>
            <h1 className="font-extrabold uppercase text-2xl text-white tracking-tight">
              System Critical Recovery
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              An unexpected application error was caught by the root tribunal. Please restart the session.
            </p>
          </div>

          <div className="pt-2 flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 bg-[#FFFF00] text-[#00189D] font-extrabold uppercase tracking-wider px-6 py-3 rounded-xl text-xs hover:bg-[#FFF833] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload ARENA
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
