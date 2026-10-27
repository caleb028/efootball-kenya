"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, MessageSquare, Flag, Plus, Sparkles } from "lucide-react";

export default function CommunityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchFeed() {
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      }
    } catch (err) {
      console.error("fetchFeed error:", err);
    }
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  async function handlePublishPost(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "POST",
          eventType: "HIGHLIGHT",
          title,
          body,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle("");
        setBody("");
        setFeedback("Community post published!");
        await fetchFeed();
      } else {
        setFeedback(data.error || "Sign in to post.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReact(eventId: string) {
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REACT", eventId }),
      });
      if (res.ok) {
        await fetchFeed();
      }
    } catch (err) {
      console.error("handleReact error:", err);
    }
  }

  async function handleComment(eventId: string) {
    const content = commentTextMap[eventId];
    if (!content?.trim()) return;
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMMENT", eventId, content }),
      });
      if (res.ok) {
        setCommentTextMap((m) => ({ ...m, [eventId]: "" }));
        await fetchFeed();
      }
    } catch (err) {
      console.error("handleComment error:", err);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-brand-royal/40 pb-6">
        <span className="esports-badge-yellow mb-2">Social Ecosystem</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
          eFootball Kenya Community Feed
        </h1>
        <p className="text-sm text-brand-grey mt-1">
          Celebrate new tournament champions, share formation tactics, react to match highlights,
          and connect with Kenyan players.
        </p>
      </div>

      {/* Share Highlight / Post Form */}
      <form onSubmit={handlePublishPost} className="esports-card p-6 space-y-4">
        <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
          Share a Match Highlight or Tactical Discussion
        </h2>
        {feedback && (
          <div className="p-3 rounded-lg bg-brand-navy border border-brand-yellow text-xs text-white">
            {feedback}
          </div>
        )}
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline (e.g. Last-minute free kick winner in the Nairobi Cup!)"
          className="esports-input"
        />
        <textarea
          rows={2}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share match details, formation tips, or shout out your opponent (@username)..."
          className="esports-input"
        />
        <button type="submit" disabled={loading} className="btn-yellow text-xs">
          Publish to Community Feed
        </button>
      </form>

      {/* Activity Feed */}
      {events.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-brand-yellow mx-auto" />
          <div className="font-display font-bold text-xl uppercase text-white">
            Community Feed Is Ready
          </div>
          <p className="text-xs text-brand-grey">
            Publish the first community post above or launch a tournament to generate activity!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div key={ev.id} className="esports-card p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="esports-badge-blue">
                    {(ev.eventType || "EVENT").replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-white">{ev.actorUsername}</span>
                  <span className="text-brand-grey">• {ev.actorCounty}</span>
                </div>
                <span className="text-brand-grey">
                  {new Date(ev.createdAt).toLocaleString("en-KE")}
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-2xl text-white">{ev.title}</h3>
                <p className="text-sm text-white/85 mt-1 whitespace-pre-line">{ev.body}</p>
                {ev.linkUrl && (
                  <Link
                    href={ev.linkUrl}
                    className="inline-block text-xs font-bold text-brand-yellow hover:underline mt-2"
                  >
                    View Competition / Details →
                  </Link>
                )}
              </div>

              {/* Reactions & Comments */}
              <div className="pt-3 border-t border-brand-royal/30 space-y-3">
                <div className="flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => handleReact(ev.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold ${
                      ev.viewerReacted
                        ? "bg-brand-yellow text-brand-navy border-brand-yellow"
                        : "bg-brand-navy text-white border-brand-royal/50 hover:border-brand-yellow"
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    {ev.reactionCount} Fire
                  </button>
                  <span className="text-brand-grey flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {Array.isArray(ev.comments) ? ev.comments.length : 0} Comments
                  </span>
                </div>

                {Array.isArray(ev.comments) && ev.comments.length > 0 && (
                  <div className="space-y-2 pl-3 border-l-2 border-brand-royal/50">
                    {ev.comments.map((c: any) => (
                      <div key={c?.id || Math.random()} className="text-xs">
                        <span className="font-bold text-brand-yellow mr-1.5">
                          {c?.authorUsername || "Player"}:
                        </span>
                        <span className="text-white/90">{c?.content || ""}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentTextMap[ev.id] || ""}
                    onChange={(e) =>
                      setCommentTextMap((m) => ({ ...m, [ev.id]: e.target.value }))
                    }
                    placeholder="Add a comment..."
                    className="esports-input text-xs py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleComment(ev.id)}
                    className="btn-royal text-xs py-1.5 px-3 shrink-0"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
