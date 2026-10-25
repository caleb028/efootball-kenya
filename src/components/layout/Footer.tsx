"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ShieldCheck, Globe } from "lucide-react";

export function Footer() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore service worker registration errors in restricted environments
      });
    }
  }, []);

  return (
    <footer className="bg-[#001275] border-t-2 border-[#FFFF00]/30 pt-16 pb-20 lg:pb-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#002BDC]">
          {/* Brand Column with 3x Enlarged Logo */}
          <div className="lg:col-span-3 space-y-6">
            <Link href="/" className="inline-block focus:outline-none">
              <Logo variant="horizontal" size="lg" />
            </Link>
            <p className="text-sm text-slate-200 max-w-lg leading-relaxed">
              Kenya&apos;s premier competitive eFootball gaming and tournament platform. Play.
              Compete. Belong. Join verified cups, compete in dedicated Match Rooms, earn official
              national Elo rankings, and lead your clan across all 47 Kenyan counties on Mobile,
              PlayStation, Xbox, and PC.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="badge-yellow text-xs">Play. Compete. Belong.</span>
              <span className="badge-blue text-xs">Every Match Counts.</span>
              <span className="text-xs text-slate-300 flex items-center gap-1.5 ml-2 font-medium">
                <Globe className="w-4 h-4 text-[#FFFF00]" />
                EAT (UTC+3) • KES
              </span>
            </div>
          </div>

          {/* Competitions & Community */}
          <div>
            <h3 className="font-display font-extrabold uppercase tracking-wider text-[#FFFF00] text-sm mb-4">
              Competitions & Community
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
              <li>
                <Link href="/tournaments" className="hover:text-[#FFFF00] transition-colors">
                  All Tournaments
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="hover:text-[#FFFF00] transition-colors">
                  National Elo Rankings
                </Link>
              </li>
              <li>
                <Link href="/clans" className="hover:text-[#FFFF00] transition-colors">
                  Clans & Teams
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-[#FFFF00] transition-colors">
                  Gaming Marketplace (KES)
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#FFFF00] transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link href="/organiser" className="hover:text-[#FFFF00] transition-colors">
                  Organiser Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Fair Play, Help & Legal */}
          <div>
            <h3 className="font-display font-extrabold uppercase tracking-wider text-[#FFFF00] text-sm mb-4">
              Fair Play & Governance
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
              <li>
                <Link href="/fair-play" className="hover:text-[#FFFF00] transition-colors">
                  Fair Play & Anti-Cheat Code
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#FFFF00] transition-colors">
                  Help & Match Room Guide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FFFF00] transition-colors">
                  Contact Support Desk
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FFFF00] transition-colors">
                  Terms of Participation
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#FFFF00] transition-colors">
                  Data Protection & Privacy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#FFFF00] transition-colors">
                  Marketplace Order Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Independent Community Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-300">
          <div className="space-y-1.5 max-w-3xl">
            <p className="font-bold text-white flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#FFFF00] shrink-0" />
              Independent Community Notice
            </p>
            <p className="leading-relaxed">
              <strong>eFootball ARENA Kenya</strong> is an independent competitive gaming and
              tournament platform operated in Kenya. This platform is not affiliated with,
              endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd.
              &ldquo;eFootball&rdquo; is a registered trademark of Konami Digital Entertainment.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p>© {new Date().getFullYear()} eFootball ARENA Kenya. All rights reserved.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nairobi, Kenya • Africa/Nairobi (EAT)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
