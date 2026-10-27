"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Users, MapPin, Megaphone, CheckCircle2, UserPlus } from "lucide-react";

export function ClanDetailClient({
  clan: initialClan,
  currentUser,
}: {
  clan: any;
  currentUser: any | null;
}) {
  const router = useRouter();
  const [clan, setClan] = useState(initialClan);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const members = Array.isArray(clan?.members) ? clan.members : [];
  const pendingRequests = Array.isArray(clan?.pendingRequests) ? clan.pendingRequests : [];
  const announcements = Array.isArray(clan?.announcements) ? clan.announcements : [];

  const myMembership = currentUser
    ? members.find((m: any) => m.userId === currentUser.id)
    : null;
  const isLeader =
    myMembership && (myMembership.role === "OWNER" || myMembership.role === "CAPTAIN");

  async function handleJoinRequest() {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "JOIN", clanIdOrSlug: clan.slug }),
      });
      const data = await res.json();
      setFeedback(data.message || data.error);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleMemberAction(
    targetUserId: string,
    memberAction: "APPROVE" | "PROMOTE_CAPTAIN" | "DEMOTE_MEMBER" | "REMOVE"
  ) {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MANAGE_MEMBER",
          clanIdOrSlug: clan.slug,
          targetUserId,
          memberAction,
        }),
      });
      const data = await res.json();
      if (res.ok && data.clan) {
        setClan(data.clan);
        setFeedback(data.message);
      } else {
        setFeedback(data.error || "Action failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ANNOUNCEMENT",
          clanIdOrSlug: clan.slug,
          title: annTitle,
          content: annContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnTitle("");
        setAnnContent("");
        setFeedback("Clan announcement published!");
        router.refresh();
      } else {
        setFeedback(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-brand-royal via-brand-darkBlue to-brand-navy border-2 border-brand-royal rounded-2xl p-6 sm:p-8 shadow-esports-blue">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-brand-navy border-2 border-brand-yellow flex items-center justify-center font-display font-bold text-2xl text-brand-yellow">
              [{clan.tag}]
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="esports-badge-yellow">{clan.county} County</span>
                <span className="esports-badge-blue">{clan.members.length} Active Members</span>
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-5xl uppercase text-white">
                {clan.name}
              </h1>
              <p className="text-sm text-white/85 max-w-2xl">{clan.description}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="bg-brand-navy px-5 py-3 rounded-xl border border-brand-royal text-right">
              <div className="text-xs text-brand-grey">Clan Rating</div>
              <div className="font-display font-bold text-3xl text-brand-yellow">
                {clan.rating} ELO
              </div>
            </div>

            {currentUser && !myMembership && (
              <button
                type="button"
                disabled={loading}
                onClick={handleJoinRequest}
                className="btn-yellow text-xs py-2.5 px-5"
              >
                <UserPlus className="w-4 h-4" />
                Request to Join Clan
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className="mt-4 p-3 rounded-lg bg-brand-navy border border-brand-yellow text-xs text-white">
            {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Members Roster */}
        <div className="lg:col-span-7 space-y-6">
          <div className="esports-card overflow-hidden">
            <div className="p-4 bg-brand-navy border-b border-brand-royal/50">
              <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
                Official Clan Roster ({members.length})
              </h2>
            </div>
            <div className="divide-y divide-brand-royal/25">
              {members.map((m: any) => (
                <div
                  key={m.id}
                  className="p-4 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <Link
                      href={`/players/${m.username}`}
                      className="font-bold text-white hover:text-brand-yellow"
                    >
                      {m.username}
                    </Link>
                    <div className="text-xs text-brand-grey">
                      {m.county} • {m.platform} • {m.wins} Wins
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-brand-yellow">
                      {m.rating} ELO
                    </span>
                    <span className="esports-badge-blue">{m.role}</span>

                    {isLeader && m.role !== "OWNER" && (
                      <div className="flex items-center gap-1">
                        {m.role === "MEMBER" ? (
                          <button
                            type="button"
                            onClick={() => handleMemberAction(m.userId, "PROMOTE_CAPTAIN")}
                            className="text-[11px] px-2 py-1 rounded bg-brand-royal text-white"
                          >
                            Make Captain
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMemberAction(m.userId, "DEMOTE_MEMBER")}
                            className="text-[11px] px-2 py-1 rounded bg-brand-navy text-brand-grey"
                          >
                            Demote
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMemberAction(m.userId, "REMOVE")}
                          className="text-[11px] px-2 py-1 rounded bg-brand-error/20 text-brand-error"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Join Requests (Visible to Owner/Captain) */}
          {isLeader && pendingRequests.length > 0 && (
            <div className="esports-card p-5 space-y-3">
              <h3 className="font-display font-bold text-lg uppercase text-brand-yellow">
                Pending Join Requests ({pendingRequests.length})
              </h3>
              {pendingRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{req.username}</span> ({req.county} •{" "}
                    {req.rating} ELO)
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMemberAction(req.userId, "APPROVE")}
                      className="btn-yellow text-xs py-1 px-3"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMemberAction(req.userId, "REMOVE")}
                      className="btn-outline text-xs py-1 px-3"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clan Announcements */}
        <div className="lg:col-span-5 space-y-6">
          {isLeader && (
            <form onSubmit={handlePostAnnouncement} className="esports-card p-5 space-y-3">
              <h3 className="font-display font-bold text-lg uppercase text-brand-yellow">
                Post Clan Announcement
              </h3>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement title"
                className="esports-input text-xs"
              />
              <textarea
                rows={2}
                required
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Squad scrimmage schedule or tournament notice..."
                className="esports-input text-xs"
              />
              <button type="submit" disabled={loading} className="btn-yellow text-xs">
                Publish to Clan
              </button>
            </form>
          )}

          <div className="esports-card p-5 space-y-3">
            <h3 className="font-display font-bold text-lg uppercase text-white">
              Clan Announcements ({announcements.length})
            </h3>
            {announcements.length === 0 ? (
              <p className="text-xs text-brand-grey">No clan announcements posted yet.</p>
            ) : (
              announcements.map((a: any) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 space-y-1 text-xs"
                >
                  <div className="font-bold text-brand-yellow">{a.title}</div>
                  <p className="text-white/90">{a.content}</p>
                  <div className="text-[10px] text-brand-grey">By {a.authorUsername}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
