import React from "react";
import Link from "next/link";
import { HelpCircle, CheckCircle2, Swords, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Help Centre & Player Guide | eFootball Kenya",
  description: "Frequently asked questions about tournament check-ins, match rooms, Elo ratings, and dispute resolution on eFootball Kenya.",
};

export default function HelpPage() {
  const faqs = [
    {
      q: "How do I register and compete in an eFootball Kenya tournament?",
      a: "Create a verified player account, select your primary platform (Mobile, PlayStation, Xbox, or PC) and Kenyan county, then visit the Tournaments page and click Register. If the tournament is full, you are placed on the automatic waitlist.",
    },
    {
      q: "How does Match Room score verification work?",
      a: "Once brackets are generated, both players open their dedicated Match Room, check in before kick-off, play the match in eFootball, and submit the final score. If both players submit the exact same score, the match is automatically verified, Elo ratings update immediately, and the winner advances.",
    },
    {
      q: "What happens if my opponent submits the wrong score?",
      a: "If Player One and Player Two submit conflicting scores, the platform automatically locks the match into DISPUTED status and alerts the Moderation Tribunal. Both players can upload full-time screenshot evidence inside the Match Room.",
    },
    {
      q: "How is my National and County Elo rating calculated?",
      a: "Every player starts at 1200 Elo. Only verified tournament matches affect your official rating using the standard Elo formula with K-factor = 32. Unverified or friendly challenges never inflate official rankings.",
    },
    {
      q: "Why are account sales blocked on the Marketplace?",
      a: "Selling or trading game accounts violates game publisher terms and exposes players to fraud. Our marketplace strictly permits physical controllers, gaming accessories, coaching, graphic design, and tournament passes.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <span className="badge-yellow mb-3 inline-block">PLAYER SUPPORT & FAQ</span>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">
          Help Centre & Competition Guide
        </h1>
        <p className="mt-2 text-sm text-ef-grey">
          Everything you need to know about Match Rooms, Elo rankings, brackets, and Fair Play rules.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, i) => (
          <div key={i} className="card-esports p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
              <HelpCircle className="h-5 w-5 shrink-0 text-ef-yellow" />
              {item.q}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ef-grey">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/fair-play" className="btn-yellow text-xs">
          Read Fair Play Code
        </Link>
        <Link href="/contact" className="btn-outline text-xs">
          Contact Support Desk
        </Link>
      </div>
    </div>
  );
}
