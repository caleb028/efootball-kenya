import React from "react";
import Link from "next/link";
import { Trophy, ShieldCheck, Users, Globe2 } from "lucide-react";

export const metadata = {
  title: "About eFootball Kenya | Every Match Counts.",
  description:
    "Learn about eFootball Kenya, Kenya's central independent competitive eFootball community, national ranking system, and tournament ecosystem.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <span className="badge-yellow mb-3 inline-block">ABOUT THE PLATFORM</span>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white sm:text-5xl">
          Kenya&apos;s Competitive eFootball Ecosystem
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ef-grey">
          <strong className="text-white">eFootball Kenya</strong> (&ldquo;Every Match Counts. • Compete. Win. Rise.&rdquo;) is Kenya&apos;s premier independent competitive eFootball community and tournament platform built for players across all 47 counties.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card-esports p-6">
          <Trophy className="mb-3 h-8 w-8 text-ef-yellow" />
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Structured National Competitions
          </h2>
          <p className="mt-2 text-sm text-ef-grey">
            From Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret county cups to national championship series and Kenyan university leagues, every bracket is automatically seeded and transparently verified.
          </p>
        </div>

        <div className="card-esports p-6">
          <ShieldCheck className="mb-3 h-8 w-8 text-ef-yellow" />
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Dual-Submission Match Verification
          </h2>
          <p className="mt-2 text-sm text-ef-grey">
            No fabricated results. Both players submit scores inside dedicated Match Rooms backed by timestamped evidence and conflict-free moderator adjudication.
          </p>
        </div>

        <div className="card-esports p-6">
          <Users className="mb-3 h-8 w-8 text-ef-yellow" />
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            All Platforms & 47 Counties
          </h2>
          <p className="mt-2 text-sm text-ef-grey">
            Whether you compete on Android, iOS, PlayStation, Xbox, or PC, your Elo rating ($K = 32$) tracks your progression at both county and national levels.
          </p>
        </div>

        <div className="card-esports p-6">
          <Globe2 className="mb-3 h-8 w-8 text-ef-yellow" />
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Independent Community Notice
          </h2>
          <p className="mt-2 text-sm text-ef-grey">
            eFootball Kenya is an independent community tournament management platform and is not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/register" className="btn-yellow">
          Create Player Account
        </Link>
        <Link href="/tournaments" className="btn-outline">
          Explore Tournaments
        </Link>
      </div>
    </div>
  );
}
