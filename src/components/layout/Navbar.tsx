"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface NavbarUser {
  id: string;
  username: string;
  displayName: string;
  county: string;
  platform: string;
  rating: number;
  roles: string[];
}

export function Navbar({
  user,
  unreadNotifications = 0,
}: {
  user: NavbarUser | null;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { href: "/tournaments", label: "Tournaments" },
    { href: "/rankings", label: "Rankings" },
    { href: "/clans", label: "Clans" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/community", label: "Community" },
  ];

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isOrganiser =
    userRoles.includes("ORGANISER") ||
    userRoles.includes("TOURNAMENT_ADMIN") ||
    userRoles.includes("SUPER_ADMIN");

  const isAdmin =
    userRoles.includes("SUPER_ADMIN") ||
    userRoles.includes("MODERATOR") ||
    userRoles.includes("TOURNAMENT_ADMIN") ||
    userRoles.includes("FINANCE_ADMIN") ||
    userRoles.includes("CONTENT_EDITOR");

  // Close menus on Esc key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/tournaments?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  return (
    <>
      {/* Sticky Desktop & Mobile Top Header — Styled with Exact Logo Royal Blue & Yellow */}
      <header className="sticky top-0 z-50 bg-[#00189D]/95 backdrop-blur-md border-b-2 border-[#FFFF00]/30 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[88px] sm:min-h-[110px] lg:min-h-[130px] py-2 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: 3x Enlarged Brand Logo (Responsive clamping to prevent mobile overflow) */}
          <Link
            href="/"
            aria-label="eFootball ARENA Kenya Home"
            className="shrink-0 focus:outline-none py-1 flex items-center"
          >
            <Logo variant="horizontal" size="md" />
          </Link>

          {/* Centre: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-xl text-sm font-display font-extrabold uppercase tracking-wider transition-all relative ${
                    active
                      ? "text-[#FFFF00] bg-[#001275]/80 shadow-sm"
                      : "text-white/90 hover:text-[#FFFF00] hover:bg-[#001582]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-1 bg-[#FFFF00] rounded-full shadow-ef-yellow" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions, Auth & Prominent Yellow Join Tournament CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search tournaments and players"
              aria-expanded={searchOpen}
              className="p-2.5 sm:p-3 rounded-xl text-white hover:text-[#FFFF00] hover:bg-[#001582] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <>
                <Link
                  href="/dashboard/notifications"
                  aria-label="Notifications"
                  className="relative p-2.5 sm:p-3 rounded-xl text-white hover:text-[#FFFF00] hover:bg-[#001582] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-4 px-1 rounded-full bg-[#FFFF00] text-[#00189D] text-[10px] font-extrabold flex items-center justify-center shadow">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* User Dropdown Pill */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#002BDC]">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#001582] border border-[#002BDC] hover:border-[#FFFF00] text-xs font-semibold text-white transition-colors min-h-[44px]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#FFFF00] text-[#00189D] font-extrabold font-display flex items-center justify-center text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">{user.username}</span>
                    <span className="text-[#FFFF00] font-mono text-[11px] font-extrabold">
                      {user.rating}
                    </span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="px-3 py-2 rounded-xl bg-[#FFFF00] text-[#00189D] font-display font-extrabold text-xs uppercase tracking-wider hover:bg-[#FFF833] transition-colors min-h-[44px] flex items-center"
                    >
                      Admin
                    </Link>
                  )}

                  {isOrganiser && !isAdmin && (
                    <Link
                      href="/organiser"
                      className="px-3 py-2 rounded-xl bg-[#0025D0] border border-[#FFFF00]/40 text-[#FFFF00] font-display font-extrabold text-xs uppercase tracking-wider hover:bg-[#002BDC] transition-colors min-h-[44px] flex items-center"
                    >
                      Organiser
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Log out"
                    className="p-2 text-white/80 hover:text-[#FF1E27] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-xs font-display font-extrabold uppercase tracking-wider text-white hover:text-[#FFFF00] transition-colors min-h-[44px] flex items-center"
                >
                  Sign In
                </Link>
                <Link href="/register" className="btn-yellow text-xs py-2.5 px-5 min-h-[44px]">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button (Accessible 44px tap target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-xl text-white hover:text-[#FFFF00] hover:bg-[#001582] min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Global Quick Search Overlay */}
        {searchOpen && (
          <div className="bg-[#001275] border-t border-[#002BDC] px-4 py-3 shadow-inner">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments, players, clans, or counties..."
                className="input-field text-sm"
              />
              <button type="submit" className="btn-yellow text-xs shrink-0 px-5 min-h-[44px]">
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer with Backdrop Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop for closing */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <div className="relative z-50 lg:hidden bg-[#001275] border-t border-[#002BDC] px-4 pt-3 pb-6 space-y-3 max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Mobile App Branding Header */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#00189D]/80 border border-[#002BDC]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-72x72.png"
                  alt="eFootball ARENA App"
                  className="w-10 h-10 rounded-xl object-cover border border-[#FFFF00]/70 shadow shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold text-sm uppercase text-white truncate">
                    eFootball ARENA Kenya
                  </div>
                  <div className="text-[10px] text-[#FFFF00] font-bold tracking-wide">
                    Play. Compete. Belong.
                  </div>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-display font-extrabold uppercase tracking-wider min-h-[44px] ${
                        active
                          ? "text-[#FFFF00] bg-[#001582] border-l-4 border-[#FFFF00]"
                          : "text-white/90 hover:text-[#FFFF00] hover:bg-[#001582]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#002BDC] space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#001582] text-sm font-bold text-white min-h-[44px]"
                    >
                      <User className="w-4 h-4 text-[#FFFF00]" />
                      Dashboard (@{user.username} - {user.rating} Elo)
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center px-4 py-3 rounded-xl bg-[#FFFF00] text-[#00189D] font-display font-extrabold text-sm uppercase min-h-[44px]"
                      >
                        Administrator Console
                      </Link>
                    )}
                    {isOrganiser && (
                      <Link
                        href="/organiser"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center px-4 py-3 rounded-xl bg-[#0025D0] text-[#FFFF00] font-display font-extrabold text-sm uppercase min-h-[44px]"
                      >
                        Organiser Hub
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-[#FF1E27] font-semibold min-h-[44px] flex items-center cursor-pointer"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-outline text-center text-xs py-3 min-h-[44px] flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-yellow text-center text-xs py-3 min-h-[44px] flex items-center justify-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
}
