"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Swords,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Upload,
  Clock,
  Trophy,
  RefreshCw,
} from "lucide-react";

interface MatchRoomClientProps {
  match: any;
  currentUser: any | null;
  initialSection?: "ROOM" | "REPORT" | "DISPUTE";
}

export function MatchRoomClient({
  match: initialMatch,
  currentUser,
  initialSection = "ROOM",
}: MatchRoomClientProps) {
  const router = useRouter();
  const [match, setMatch] = useState(initialMatch);
  const [p1Score, setP1Score] = useState<string>(
    initialMatch.playerOneScore !== null ? String(initialMatch.playerOneScore) : "0"
  );
  const [p2Score, setP2Score] = useState<string>(
    initialMatch.playerTwoScore !== null ? String(initialMatch.playerTwoScore) : "0"
  );
  const [notes, setNotes] = useState("");
  const [evidenceCaption, setEvidenceCaption] = useState("");
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | null>(null);

  const [disputeCategory, setDisputeCategory] = useState("CONFLICTING_SCORES");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [appealReason, setAppealReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const isParticipant =
    currentUser &&
    (currentUser.id === match.playerOne?.id || currentUser.id === match.playerTwo?.id);

  async function refreshMatch() {
    const res = await fetch(`/api/matches/${match.id}`);
    if (res.ok) {
      const data = await res.json();
      setMatch(data.match);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEvidenceDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCheckIn() {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECKIN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Check-in failed." });
      } else {
        setMatch(data.match);
        setFeedback({ type: "ok", text: data.message });
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_RESULT",
          playerOneScore: Number(p1Score),
          playerTwoScore: Number(p2Score),
          notes,
          evidenceCaption,
          evidenceDataUrl: evidenceDataUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed to submit result." });
      } else {
        setMatch(data.match);
        setFeedback({ type: "ok", text: data.message });
        router.refresh();
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDispute(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OPEN_DISPUTE",
          category: disputeCategory,
          description: disputeDescription,
          evidenceStoragePath: evidenceDataUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Dispute submission failed." });
      } else {
        setMatch(data.match);
        setDisputeDescription("");
        setFeedback({ type: "ok", text: data.message });
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleAppealDispute(disputeId: string) {
    if (!appealReason.trim()) return;
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPEAL_DISPUTE",
          disputeId,
          reason: appealReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Appeal failed." });
      } else {
        setMatch(data.match);
        setAppealReason("");
        setFeedback({ type: "ok", text: data.message });
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {match.tournamentSlug ? (
            <Link
              href={`/tournaments/${match.tournamentSlug}`}
              className="text-xs font-bold text-brand-yellow hover:underline"
            >
              ← Back to {match.tournamentTitle}
            </Link>
          ) : (
            <Link
              href="/dashboard/challenges"
              className="text-xs font-bold text-brand-yellow hover:underline"
            >
              ← Back to Friendly Challenges
            </Link>
          )}
          <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase text-white mt-1">
            Official Match Room • {match.roundLabel}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshMatch}
            className="btn-outline text-xs py-2 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Room
          </button>
          <span
            className={`px-3 py-1.5 rounded-lg font-display font-bold uppercase text-sm ${
              match.status === "COMPLETED"
                ? "bg-brand-success text-white"
                : match.status === "DISPUTED"
                ? "bg-brand-error text-white"
                : "bg-brand-yellow text-brand-navy"
            }`}
          >
            {match.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Main Broadcast Scoreboard */}
      <div className="bg-brand-midnight border-2 border-brand-royal rounded-2xl p-6 sm:p-8 shadow-esports-blue">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
          {/* Player 1 */}
          <div className="md:col-span-4 bg-brand-darkBlue border border-brand-royal/50 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-yellow font-display font-bold uppercase">
                Player One (Home)
              </span>
              {match.playerOne?.checkedIn ? (
                <span className="text-brand-success font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                </span>
              ) : (
                <span className="text-brand-grey">Awaiting Check-In</span>
              )}
            </div>
            <div className="font-display font-bold text-2xl text-white">
              {match.playerOne ? (
                <Link
                  href={`/players/${match.playerOne.username}`}
                  className="hover:text-brand-yellow"
                >
                  {match.playerOne.username}
                </Link>
              ) : (
                "TBD / Bye"
              )}
            </div>
            {match.playerOne && (
              <div className="text-xs text-brand-grey space-y-0.5">
                <div>
                  {match.playerOne.county} County •{" "}
                  <span className="text-brand-yellow font-bold">
                    {match.playerOne.rating} ELO
                  </span>
                </div>
                {match.playerOne.efootballId && (
                  <div className="font-mono text-white/90">
                    eFootball ID: {match.playerOne.efootballId}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Centre Score Display */}
          <div className="md:col-span-3 text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-brand-navy border-2 border-brand-yellow/80 font-display font-bold text-4xl sm:text-5xl text-brand-yellow">
              <span>{match.playerOneScore ?? "-"}</span>
              <span className="text-white/40">:</span>
              <span>{match.playerTwoScore ?? "-"}</span>
            </div>
            <div className="text-xs text-brand-grey flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-yellow" />
              {new Date(match.scheduledAt).toLocaleString("en-KE")}
            </div>
            {match.winnerUsername && (
              <div className="text-xs font-display font-bold uppercase text-brand-success">
                Verified Winner: {match.winnerUsername}
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className="md:col-span-4 bg-brand-darkBlue border border-brand-royal/50 rounded-xl p-5 space-y-2 md:text-right">
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-yellow font-display font-bold uppercase">
                Player Two (Away)
              </span>
              {match.playerTwo?.checkedIn ? (
                <span className="text-brand-success font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                </span>
              ) : (
                <span className="text-brand-grey">Awaiting Check-In</span>
              )}
            </div>
            <div className="font-display font-bold text-2xl text-white">
              {match.playerTwo ? (
                <Link
                  href={`/players/${match.playerTwo.username}`}
                  className="hover:text-brand-yellow"
                >
                  {match.playerTwo.username}
                </Link>
              ) : (
                "TBD / Bye"
              )}
            </div>
            {match.playerTwo && (
              <div className="text-xs text-brand-grey space-y-0.5">
                <div>
                  {match.playerTwo.county} County •{" "}
                  <span className="text-brand-yellow font-bold">
                    {match.playerTwo.rating} ELO
                  </span>
                </div>
                {match.playerTwo.efootballId && (
                  <div className="font-mono text-white/90">
                    eFootball ID: {match.playerTwo.efootballId}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Participant Check-in Bar */}
        {isParticipant &&
          match.status !== "COMPLETED" &&
          match.status !== "WALKOVER" && (
            <div className="mt-6 pt-5 border-t border-brand-royal/40 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-white/90">
                <strong>Step 1:</strong> Check in to confirm you are ready inside eFootball.{" "}
                <strong>Step 2:</strong> Play the match and submit the full-time score below.
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleCheckIn}
                className="btn-royal text-xs py-2"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-yellow" />
                Check In to Match Room
              </button>
            </div>
          )}

        {feedback && (
          <div
            className={`mt-5 p-3.5 rounded-lg border text-xs ${
              feedback.type === "ok"
                ? "bg-brand-success/20 border-brand-success text-white"
                : "bg-brand-error/20 border-brand-error text-white"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Score Submission & Verification Panel (Section 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {isParticipant &&
          match.status !== "COMPLETED" &&
          match.status !== "WALKOVER" ? (
            <form onSubmit={handleSubmitScore} className="esports-card p-6 space-y-5">
              <div>
                <span className="esports-badge-yellow mb-1">Dual-Player Verification</span>
                <h2 className="font-display font-bold text-2xl uppercase text-white">
                  Submit Final Match Score
                </h2>
                <p className="text-xs text-brand-grey mt-0.5">
                  When both players submit matching scores, the result is automatically confirmed,
                  Elo ratings update, and the winner advances in the bracket. Conflicting scores
                  automatically trigger a Moderator Dispute.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-yellow mb-1.5">
                    {match.playerOne?.username || "Player 1"} Goals
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    required
                    value={p1Score}
                    onChange={(e) => setP1Score(e.target.value)}
                    className="esports-input text-center font-display font-bold text-2xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-yellow mb-1.5">
                    {match.playerTwo?.username || "Player 2"} Goals
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    required
                    value={p2Score}
                    onChange={(e) => setP2Score(e.target.value)}
                    className="esports-input text-center font-display font-bold text-2xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
                  Private Scoreboard Screenshot Proof (Optional — Stored Privately)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-brand-grey file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-royal file:text-white hover:file:bg-brand-electric"
                />
                <input
                  type="text"
                  value={evidenceCaption}
                  onChange={(e) => setEvidenceCaption(e.target.value)}
                  placeholder="Evidence caption (e.g. Full-time statistics screen)"
                  className="esports-input mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
                  Match Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Good game! Clean connection."
                  className="esports-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-yellow w-full py-3">
                {loading ? "Submitting Result..." : "Submit Official Match Score"}
              </button>
            </form>
          ) : (
            <div className="esports-card p-6 space-y-3">
              <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
                Score Verification Status
              </h2>
              <p className="text-sm text-white/90">
                {match.status === "COMPLETED" || match.status === "WALKOVER"
                  ? "This fixture has been verified and finalised."
                  : "Only the two assigned match participants can submit scores for this fixture."}
              </p>
            </div>
          )}

          {/* Submitted Reports Log */}
          <div className="esports-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xl uppercase text-white">
              Player Score Submissions ({match.submissions.length} / 2)
            </h3>
            {match.submissions.length === 0 ? (
              <p className="text-xs text-brand-grey">No score reports submitted yet.</p>
            ) : (
              <div className="space-y-2.5">
                {match.submissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{sub.submittedByUsername}</span>{" "}
                      reported{" "}
                      <span className="text-brand-yellow font-display font-bold text-sm">
                        {sub.playerOneScore} - {sub.playerTwoScore}
                      </span>
                      {sub.notes && (
                        <p className="text-brand-grey mt-0.5">&ldquo;{sub.notes}&rdquo;</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-brand-darkBlue text-brand-yellow font-display font-bold uppercase">
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rules, Private Evidence Vault & Dispute Centre */}
        <div className="lg:col-span-5 space-y-6">
          <div className="esports-card p-5 space-y-2">
            <h3 className="font-display font-bold text-lg uppercase text-brand-yellow">
              Match Rules
            </h3>
            <p className="text-xs text-white/85 whitespace-pre-line leading-relaxed">
              {match.rulesContent}
            </p>
          </div>

          {/* Private Evidence Vault (Section 11 Privacy Protection) */}
          <div className="esports-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg uppercase text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-brand-yellow" />
                Private Evidence Vault
              </h3>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-brand-navy text-brand-grey">
                Restricted Access
              </span>
            </div>

            {!match.canViewPrivateEvidence ? (
              <p className="text-xs text-brand-grey">
                Per eFootball Kenya privacy policy, match screenshots and recordings are stored
                privately and are only visible to the match participants, tournament organiser, and
                authorised moderators.
              </p>
            ) : match.evidence.length === 0 ? (
              <p className="text-xs text-brand-grey">
                No private screenshots or video proofs uploaded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {match.evidence.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg bg-brand-navy border border-brand-royal/40 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-brand-yellow">
                        Uploaded by {ev.uploadedByUsername}
                      </span>
                      <span className="text-brand-grey">{ev.fileType}</span>
                    </div>
                    {ev.caption && <p className="text-white/90">{ev.caption}</p>}
                    {ev.storagePath.startsWith("data:image/") && (
                      <img
                        src={ev.storagePath}
                        alt={ev.caption || "Private match evidence"}
                        className="rounded-lg border border-brand-royal/40 max-h-40 object-contain mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dispute & No-Show Resolution Panel (Section 12) */}
          <div className="esports-card p-5 space-y-4">
            <h3 className="font-display font-bold text-lg uppercase text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-error" />
              Dispute & No-Show Centre
            </h3>

            {match.disputes.length > 0 && (
              <div className="space-y-3">
                {match.disputes.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-lg bg-brand-error/15 border border-brand-error/50 text-xs space-y-2"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-brand-yellow">{d.category.replace(/_/g, " ")}</span>
                      <span className="uppercase text-white">{d.status}</span>
                    </div>
                    <p className="text-white/90">{d.description}</p>
                    <div className="text-[11px] text-brand-grey">
                      Opened by {d.openedByUsername}
                    </div>

                    {isParticipant && d.status === "RESOLVED" && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <input
                          type="text"
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          placeholder="Submit one official appeal reason..."
                          className="esports-input text-xs py-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleAppealDispute(d.id)}
                          className="btn-outline text-xs py-1.5 px-3"
                        >
                          Submit Official Appeal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isParticipant && match.status !== "COMPLETED" && (
              <form onSubmit={handleOpenDispute} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                    Dispute Category
                  </label>
                  <select
                    value={disputeCategory}
                    onChange={(e) => setDisputeCategory(e.target.value)}
                    className="esports-input text-xs"
                  >
                    <option value="CONFLICTING_SCORES">Conflicting Scores</option>
                    <option value="NO_SHOW">Opponent No-Show (Walkover Request)</option>
                    <option value="CONNECTION_PROBLEM">Severe Connection / Lag Disconnect</option>
                    <option value="RULE_VIOLATION">Tournament Rule Violation</option>
                    <option value="SUSPECTED_CHEATING">Suspected Cheating / Network Tampering</option>
                    <option value="UNSPORTING_CONDUCT">Unsporting Conduct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                    Incident Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Provide clear details and timestamps for the Moderator..."
                    className="esports-input text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-brand-error text-white font-display font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-colors"
                >
                  Escalate Match to Moderator Review
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
