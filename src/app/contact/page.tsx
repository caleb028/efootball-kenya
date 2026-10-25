import React from "react";
import Link from "next/link";
import { Mail, MapPin, Clock, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Contact & Organiser Inquiries | eFootball Kenya",
  description: "Get in touch with the eFootball Kenya tournament operations, moderation, and sponsorship teams.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <span className="badge-yellow mb-3 inline-block">GET IN TOUCH</span>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">
          Contact eFootball Kenya
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ef-grey">
          Reach our Nairobi operations desk for tournament sanctioning, university club partnerships, sponsorship inquiries, or account support.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card-esports p-6">
          <Mail className="mb-3 h-7 w-7 text-ef-yellow" />
          <h2 className="font-display text-xl font-bold uppercase text-white">
            Official Desks
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ef-grey">
            <li>
              <strong className="text-white">Support:</strong> support@efootballkenya.co.ke
            </li>
            <li>
              <strong className="text-white">Tournaments:</strong> organisers@efootballkenya.co.ke
            </li>
            <li>
              <strong className="text-white">Partnerships:</strong> sponsors@efootballkenya.co.ke
            </li>
          </ul>
        </div>

        <div className="card-esports p-6">
          <MapPin className="mb-3 h-7 w-7 text-ef-yellow" />
          <h2 className="font-display text-xl font-bold uppercase text-white">
            Operations Hub
          </h2>
          <p className="mt-3 text-sm text-ef-grey">
            Nairobi, Kenya (East Africa Time — EAT / UTC+3)
            <br />
            Serving players across all 47 Kenyan counties.
          </p>
        </div>

        <div className="card-esports p-6">
          <Clock className="mb-3 h-7 w-7 text-ef-yellow" />
          <h2 className="font-display text-xl font-bold uppercase text-white">
            Match Tribunal Hours
          </h2>
          <p className="mt-3 text-sm text-ef-grey">
            Live tournament check-in and dispute moderators operate daily between 10:00 EAT and 23:30 EAT.
          </p>
        </div>
      </div>

      <div className="card-esports mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-ef-yellow" />
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white">
                Need to Report a Match Result or Dispute?
              </h3>
              <p className="text-xs text-ef-grey">
                Use your Match Room directly so evidence and opponent notifications are attached automatically.
              </p>
            </div>
          </div>
          <Link href="/dashboard/matches" className="btn-yellow text-xs">
            Open My Matches
          </Link>
        </div>
      </div>
    </div>
  );
}
