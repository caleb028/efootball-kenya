"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for production analytics
    console.error("[eFootball ARENA Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="card-esports max-w-lg w-full p-8 sm:p-10 text-center space-y-6 shadow-2xl border-2 border-[#FF1E27]/50 relative overflow-hidden">
        <div className="flex justify-center">
          <Logo variant="horizontal" size="md" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#FF1E27]/20 border border-[#FF1E27] text-[#FF1E27] flex items-center justify-center mx-auto shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="badge-red text-xs font-mono font-extrabold px-3 py-1">
            APPLICATION SYSTEM NOTICE
          </span>
          <h1 className="font-display font-extrabold uppercase text-2xl sm:text-3xl text-white tracking-tight pt-2">
            Temporary Pitch Interruption
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            A temporary system error occurred while loading this competition screen. Click Retry to reconnect to the live database.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-400">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-yellow text-xs py-3 px-6 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Pitch Connection
          </button>
          <Link href="/" className="btn-outline text-xs py-3 px-6">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
