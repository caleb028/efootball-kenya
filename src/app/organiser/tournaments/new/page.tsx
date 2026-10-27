"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle, ShieldCheck } from "lucide-react";
import {
  PLATFORMS,
  TOURNAMENT_CATEGORIES,
  TOURNAMENT_FORMATS,
  KENYA_COUNTIES,
} from "@/lib/constants/kenya";

export default function CreateTournamentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("WEEKEND_CUP");
  const [format, setFormat] = useState("SINGLE_ELIMINATION");
  const [platform, setPlatform] = useState("MOBILE");
  const [region, setRegion] = useState("National");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [seedingMode, setSeedingMode] = useState<"SEEDED" | "RANDOM">("SEEDED");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 16)
  );
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 4 * 86400_000).toISOString().slice(0, 16)
  );
  const [prizeDetails, setPrizeDetails] = useState(
    "Championship Title + National Elo Points + Gold Champion Badge"
  );
  const [sponsorName, setSponsorName] = useState("");
  const [livestreamUrl, setLivestreamUrl] = useState("");
  const [competingTeamsText, setCompetingTeamsText] = useState("");
  const [status, setStatus] = useState("REGISTRATION_OPEN");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          format,
          platform,
          region,
          maxParticipants: Number(maxParticipants),
          seedingMode,
          registrationDeadline: new Date(registrationDeadline).toISOString(),
          startDate: new Date(startDate).toISOString(),
          prizeDetails,
          sponsorName: sponsorName || undefined,
          livestreamUrl: livestreamUrl || undefined,
          competingTeams: competingTeamsText.trim() ? competingTeamsText : undefined,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create tournament.");
      } else {
        router.push(`/tournaments/${data.tournament.slug}`);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <Link href="/organiser" className="text-xs font-bold text-brand-yellow hover:underline">
          ← Back to Organiser Dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase text-white mt-1">
          Create Official eFootball Kenya Tournament
        </h1>
        <p className="text-xs text-brand-grey mt-1">
          Configure format, platform, seeding, rules, and automated bracket generation.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-brand-error/20 border border-brand-error text-xs text-white flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-brand-error shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="esports-card p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Tournament Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Kenya Open — October 2026 Championship"
              className="esports-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Tournament Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="esports-input"
            >
              {TOURNAMENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Competition Format *
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="esports-input"
            >
              {TOURNAMENT_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Gaming Platform *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="esports-input"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Region / County *
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="esports-input"
            >
              <option value="National">National (All 47 Counties)</option>
              {KENYA_COUNTIES.map((c) => (
                <option key={c} value={`${c} County`}>
                  {c} County
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Maximum Slots *
            </label>
            <select
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              className="esports-input"
            >
              {[4, 8, 16, 32, 64, 128].map((n) => (
                <option key={n} value={String(n)}>
                  {n} Players
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Bracket Seeding Mode *
            </label>
            <select
              value={seedingMode}
              onChange={(e) => setSeedingMode(e.target.value as any)}
              className="esports-input"
            >
              <option value="SEEDED">Seeded by Official Elo Rating</option>
              <option value="RANDOM">Random Draw</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Registration Deadline (EAT) *
            </label>
            <input
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="esports-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Kickoff Date & Time (EAT) *
            </label>
            <input
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="esports-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
            Tournament Description & Overview *
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe match windows, eligibility, and format details..."
            className="esports-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Recognition / Prizes
            </label>
            <input
              type="text"
              value={prizeDetails}
              onChange={(e) => setPrizeDetails(e.target.value)}
              className="esports-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Sponsor Name (Optional)
            </label>
            <input
              type="text"
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="e.g. Nairobi Gaming Hub"
              className="esports-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Publication Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="esports-input"
            >
              <option value="REGISTRATION_OPEN">Publish & Open Registration</option>
              <option value="DRAFT">Save as Organiser Draft</option>
            </select>
          </div>
        </div>

        {/* Competing Teams Bulk Upload / Auto-Fixtures */}
        <div className="p-4 sm:p-5 rounded-xl bg-brand-navy border border-brand-royal/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase text-brand-yellow">
              Upload Competing Teams & Auto-Generate Fixtures (Optional)
            </label>
            <span className="text-[11px] text-brand-grey font-mono">1 Team Per Line or Comma-Separated</span>
          </div>
          <p className="text-xs text-brand-grey">
            Enter or paste competing team names (e.g. <em>AFC Leopards, Gor Mahia, Tusker FC, Bandari</em>). If entered, all fixtures, match schedule, and brackets will be generated automatically upon creation! If left blank, players can register their teams individually online.
          </p>
          <textarea
            rows={4}
            value={competingTeamsText}
            onChange={(e) => setCompetingTeamsText(e.target.value)}
            placeholder="e.g.&#10;Arsenal eFC Nairobi&#10;Chelsea Kenya Warriors&#10;Real Madrid Eldoret&#10;Barcelona Mombasa FC"
            className="esports-input font-mono text-xs"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-yellow w-full py-3.5 text-base">
          <Trophy className="w-5 h-5" />
          {loading ? "Creating Competition..." : competingTeamsText.trim() ? "Create & Auto-Generate Fixtures" : "Launch Official Competition"}
        </button>
      </form>
    </div>
  );
}
