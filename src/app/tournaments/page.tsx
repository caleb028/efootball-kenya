import React from "react";
import Link from "next/link";
import { Trophy, Plus, Users, Calendar, Shield, Gamepad2 } from "lucide-react";
import { listTournaments } from "@/lib/services/tournaments";
import { getCurrentUser, hasAnyRole } from "@/lib/services/auth";
import {
  PLATFORMS,
  TOURNAMENT_CATEGORIES,
  TOURNAMENT_FORMATS,
} from "@/lib/constants/kenya";

export default function TournamentsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    platform?: string;
    category?: string;
    format?: string;
    q?: string;
  };
}) {
  const user = getCurrentUser();
  const canCreate = hasAnyRole(user, ["ORGANISER", "TOURNAMENT_ADMIN", "SUPER_ADMIN"]);

  const tournaments = listTournaments({
    status: searchParams.status,
    platform: searchParams.platform,
    category: searchParams.category,
    format: searchParams.format,
    search: searchParams.q,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-royal/40 pb-6">
        <div>
          <span className="esports-badge-yellow mb-2">Competitive Circuit</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
            eFootball Kenya Tournaments
          </h1>
          <p className="text-sm text-brand-grey mt-1">
            Discover Daily Quick Cups, Weekend Cups, County Championships, University Leagues, and
            Clan Tournaments.
          </p>
        </div>
        {canCreate && (
          <Link href="/organiser/tournaments/new" className="btn-yellow shrink-0">
            <Plus className="w-4 h-4" />
            Create Tournament
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <form
        method="GET"
        action="/tournaments"
        className="esports-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="Search by title or region..."
          className="esports-input"
        />

        <select
          name="platform"
          defaultValue={searchParams.platform || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.short}
            </option>
          ))}
        </select>

        <select
          name="category"
          defaultValue={searchParams.category || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All Categories</option>
          {TOURNAMENT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          name="format"
          defaultValue={searchParams.format || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All Formats</option>
          {TOURNAMENT_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn-royal w-full">
          Apply Filters
        </button>
      </form>

      {/* Tournament Grid */}
      {tournaments.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-4">
          <Trophy className="w-12 h-12 text-brand-yellow mx-auto" />
          <h2 className="font-display font-bold text-2xl uppercase text-white">
            No Matching Tournaments Found
          </h2>
          <p className="text-sm text-brand-grey max-w-md mx-auto">
            {canCreate
              ? "Launch a new tournament right now from the Organiser Hub."
              : "Check back soon or clear your search filters to view all published competitions."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {canCreate ? (
              <Link href="/organiser/tournaments/new" className="btn-yellow">
                Create Tournament
              </Link>
            ) : (
              <Link href="/tournaments" className="btn-outline">
                Reset Filters
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => {
            const isOpen = t.status === "REGISTRATION_OPEN" || t.status === "PUBLISHED";
            return (
              <div
                key={t.id}
                className="esports-card-hover flex flex-col justify-between overflow-hidden"
              >
                <div className="bg-gradient-to-r from-brand-royal to-brand-navy p-5 border-b border-brand-royal/50">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded bg-brand-navy/85 text-white text-xs font-bold uppercase">
                      {t.platform}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-display font-bold uppercase ${
                        isOpen
                          ? "bg-brand-yellow text-brand-navy"
                          : t.status === "IN_PROGRESS"
                          ? "bg-brand-success text-white"
                          : "bg-brand-navy text-brand-grey"
                      }`}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-2xl uppercase text-white">
                    {t.title}
                  </h2>
                  <p className="text-xs text-white/80 mt-1">
                    {t.category.replace(/_/g, " ")} • {t.format.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-brand-grey line-clamp-2">{t.description}</p>

                  <div className="space-y-2 text-xs text-brand-grey border-t border-brand-royal/30 pt-3">
                    <div className="flex justify-between">
                      <span>Region:</span>
                      <span className="text-white font-semibold">{t.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kickoff Date:</span>
                      <span className="text-white font-semibold">
                        {new Date(t.startDate).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registered Slots:</span>
                      <span className="text-brand-yellow font-display font-bold text-sm">
                        {t.registeredCount} / {t.maxParticipants}
                        {t.waitlistCount > 0 ? ` (+${t.waitlistCount} waitlist)` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entry:</span>
                      <span className="text-white font-medium truncate max-w-[180px]">
                        {t.entryRequirement}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/tournaments/${t.slug}`}
                    className={isOpen ? "btn-yellow w-full text-sm" : "btn-royal w-full text-sm"}
                  >
                    {isOpen ? "Register / View Details" : "Open Bracket & Fixtures"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
