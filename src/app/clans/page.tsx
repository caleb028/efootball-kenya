"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Plus, Users, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { KENYA_COUNTIES } from "@/lib/constants/kenya";

export default function ClansPage() {
  const router = useRouter();
  const [clans, setClans] = useState<any[]>([]);
  const [countyFilter, setCountyFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchClans() {
    const params = new URLSearchParams();
    if (countyFilter !== "ALL") params.set("county", countyFilter);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/clans?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setClans(data.clans || []);
    }
  }

  useEffect(() => {
    fetchClans();
  }, [countyFilter]);

  async function handleCreateClan(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          name,
          tag,
          county,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed to create clan." });
      } else {
        router.push(`/clans/${data.clan.slug}`);
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-royal/40 pb-6">
        <div>
          <span className="esports-badge-yellow mb-2">Team Ecosystem</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
            eFootball Kenya Clans & Teams
          </h1>
          <p className="text-sm text-brand-grey mt-1">
            Form your county squad, recruit verified players, and compete in Clan Championships.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="btn-yellow shrink-0"
        >
          <Plus className="w-4 h-4" />
          {createOpen ? "Close Clan Form" : "Create New Clan"}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs ${
            feedback.type === "ok"
              ? "bg-brand-success/20 border-brand-success text-white"
              : "bg-brand-error/20 border-brand-error text-white"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {createOpen && (
        <form onSubmit={handleCreateClan} className="esports-card p-6 space-y-4">
          <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
            Establish an Official Kenyan eFootball Clan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                Clan Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nairobi Royals Esports"
                className="esports-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                Clan Tag (2–6 Chars) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="e.g. NRB"
                className="esports-input uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                Home County *
              </label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="esports-input"
              >
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
              Clan Description & Recruitment Requirements *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your clan philosophy, practice schedule, and recruitment criteria..."
              className="esports-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-yellow">
            {loading ? "Founding Clan..." : "Found Clan"}
          </button>
        </form>
      )}

      {/* Search & County Filter */}
      <div className="esports-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clan name or [TAG]..."
          className="esports-input"
        />
        <select
          value={countyFilter}
          onChange={(e) => setCountyFilter(e.target.value)}
          className="esports-input"
        >
          <option value="ALL">All 47 Counties</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c} County
            </option>
          ))}
        </select>
        <button type="button" onClick={fetchClans} className="btn-royal">
          Search Clans
        </button>
      </div>

      {/* Clan Cards */}
      {clans.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-3">
          <Shield className="w-10 h-10 text-brand-yellow mx-auto" />
          <h2 className="font-display font-bold text-2xl uppercase text-white">
            No Clans Founded Yet
          </h2>
          <p className="text-xs text-brand-grey">
            Click &ldquo;Create New Clan&rdquo; above to establish the first competitive clan!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clans.map((c) => (
            <Link
              key={c.id}
              href={`/clans/${c.slug}`}
              className="esports-card-hover p-6 flex flex-col justify-between gap-4 block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-brand-royal border-2 border-brand-yellow flex items-center justify-center font-display font-bold text-lg text-brand-yellow">
                    [{c.tag}]
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">{c.name}</h3>
                    <div className="text-xs text-brand-grey flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-yellow" />
                      {c.county} County
                    </div>
                  </div>
                </div>
                <span className="esports-badge-yellow">#{c.rank}</span>
              </div>

              <p className="text-xs text-brand-grey line-clamp-2">{c.description}</p>

              <div className="pt-3 border-t border-brand-royal/30 flex items-center justify-between text-xs">
                <span className="text-white font-semibold">{c.memberCount} Members</span>
                <span className="text-brand-yellow font-display font-bold text-base">
                  {c.rating} ELO
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
