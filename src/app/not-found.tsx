import React from "react";
import Link from "next/link";
import { Trophy, ArrowLeft, Swords } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata = {
  title: "Page Not Found | eFootball ARENA Kenya",
  description: "The requested page or competition does not exist on eFootball ARENA Kenya.",
};

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="card-esports max-w-lg w-full p-8 sm:p-10 text-center space-y-6 shadow-2xl border-2 border-[#FFFF00]/30 relative overflow-hidden">
        <div
          className="absolute -top-16 -left-16 w-40 h-40 bg-[#002BDC]/40 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#FFFF00]/15 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex justify-center">
          <Logo variant="horizontal" size="md" />
        </div>

        <div className="space-y-2">
          <span className="badge-yellow text-xs font-mono font-extrabold px-3 py-1">
            404 • MATCH NOT FOUND
          </span>
          <h1 className="font-display font-extrabold uppercase text-3xl sm:text-4xl text-white tracking-tight pt-2">
            Pitch Out of Bounds
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            The tournament, match room, or player profile you are looking for has expired or moved to a different fixture.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-yellow text-xs py-3 px-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link href="/tournaments" className="btn-outline text-xs py-3 px-6">
            <Trophy className="w-4 h-4" />
            Active Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}
