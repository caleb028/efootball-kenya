import React from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, Scale } from "lucide-react";

export const metadata = {
  title: "Fair Play Code & Anti-Cheat Charter | eFootball Kenya",
  description: "Official competitive integrity, anti-cheat, check-in, and dispute rules for eFootball Kenya tournaments.",
};

export default function FairPlayPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="badge-yellow mb-3 inline-block">COMPETITIVE INTEGRITY</span>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">
        eFootball Kenya Fair Play Code
      </h1>
      <p className="mt-2 text-sm text-ef-grey">
        Every Match Counts. Our competitive rules guarantee transparent brackets and honest rankings across Kenya.
      </p>

      <div className="mt-8 space-y-6">
        <div className="card-esports p-6">
          <div className="flex items-center gap-2 text-ef-yellow">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-display text-xl font-bold uppercase text-white">
              1. Mandatory Match Room Check-In & Evidence
            </h2>
          </div>
          <p className="mt-2 text-sm text-ef-grey">
            Players must check into their Match Room within the scheduled window. Always capture a clear screenshot of the final match statistics screen showing both gamer tags and the full-time scoreline.
          </p>
        </div>

        <div className="card-esports p-6">
          <div className="flex items-center gap-2 text-ef-red">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-display text-xl font-bold uppercase text-white">
              2. Zero Tolerance for Network Tampering & Score Fabrication
            </h2>
          </div>
          <p className="mt-2 text-sm text-ef-grey">
            Intentional disconnections (&ldquo;nulling&rdquo; or lag switching), submitting doctored screenshots, or colluding on match outcomes carries an immediate tournament forfeiture (0-3) and account suspension.
          </p>
        </div>

        <div className="card-esports p-6">
          <div className="flex items-center gap-2 text-ef-yellow">
            <Scale className="h-5 w-5" />
            <h2 className="font-display text-xl font-bold uppercase text-white">
              3. Impartial Dispute Tribunal & Right to Appeal
            </h2>
          </div>
          <p className="mt-2 text-sm text-ef-grey">
            Moderators are strictly blocked by system controls from adjudicating any match in which they are a participant. Players may submit a formal appeal with additional video or screenshot proof from the Match Dispute page.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/tournaments" className="btn-yellow text-xs">
          Browse Verified Tournaments
        </Link>
      </div>
    </div>
  );
}
