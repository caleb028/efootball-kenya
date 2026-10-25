import React from "react";
import Link from "next/link";
import { Video, Sparkles, Trophy } from "lucide-react";
import { listArticles, listCommunityEvents } from "@/lib/services/clans-community";
import { listTournaments } from "@/lib/services/tournaments";

export default function HighlightsPage() {
  const highlights = listArticles({ highlightsOnly: true });
  const communityHighlights = listCommunityEvents(12).filter(
    (e) => e.eventType === "HIGHLIGHT" || e.eventType === "NEW_CHAMPION"
  );
  const streamedTournaments = listTournaments().filter((t) => Boolean(t.livestreamUrl));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-brand-royal/40 pb-6">
        <span className="esports-badge-yellow mb-2">Broadcast & Clips</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
          Match Highlights & Livestreams
        </h1>
        <p className="text-sm text-brand-grey mt-1">
          Watch authorised tournament livestreams, championship finals, and approved community goal
          highlights.
        </p>
      </div>

      {/* Tournament Livestreams */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
          Authorised Tournament Broadcasts
        </h2>
        {streamedTournaments.length === 0 ? (
          <div className="esports-card p-8 text-center space-y-2">
            <Video className="w-10 h-10 text-brand-yellow mx-auto" />
            <p className="text-xs text-brand-grey">
              No live YouTube broadcast embeds active right now. Organisers can attach an
              authorised YouTube embed link when creating or managing a tournament.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {streamedTournaments.map((t) => (
              <div key={t.id} className="esports-card p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-xl text-white">{t.title}</h3>
                  <Link href={`/tournaments/${t.slug}`} className="text-xs text-brand-yellow">
                    Open Bracket →
                  </Link>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-brand-navy border border-brand-royal">
                  <iframe
                    src={t.livestreamUrl!}
                    title={t.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community & Editorial Highlights */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-2xl uppercase text-white">
          Recent Champions & Community Highlights
        </h2>
        {highlights.length === 0 && communityHighlights.length === 0 ? (
          <div className="esports-card p-8 text-center space-y-2">
            <Sparkles className="w-9 h-9 text-brand-yellow mx-auto" />
            <p className="text-xs text-brand-grey">
              Share your best goals and tournament moments on the Community Feed!
            </p>
            <Link href="/community" className="btn-yellow text-xs">
              Post a Highlight
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {communityHighlights.map((ch) => (
              <div key={ch.id} className="esports-card p-5 space-y-2">
                <span className="esports-badge-yellow">{ch.eventType}</span>
                <h3 className="font-display font-bold text-xl text-white">{ch.title}</h3>
                <p className="text-xs text-brand-grey">{ch.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
