import React from "react";

export const metadata = {
  title: "Terms of Service | eFootball Kenya",
  description: "Official Terms of Service governing participation on the eFootball Kenya competitive gaming platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="badge-yellow mb-3 inline-block">LEGAL GOVERNANCE</span>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">
        Terms of Service
      </h1>
      <p className="mt-2 text-xs text-ef-grey">
        Jurisdiction: Republic of Kenya • Timezone: Africa/Nairobi (EAT)
      </p>

      <div className="card-esports mt-8 space-y-6 p-6 text-sm leading-relaxed text-ef-grey">
        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            1. Independent Platform Disclaimer
          </h2>
          <p className="mt-2">
            eFootball Kenya is an independent competitive gaming and tournament management platform operated in Kenya. It is not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd. All game trademarks belong to their respective owners.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            2. Account Eligibility & One-Account Rule
          </h2>
          <p className="mt-2">
            Each player may register and maintain only one active competitive account. Multi-accounting, smurfing, or impersonating another player in tournaments results in immediate disqualification, Elo forfeiture, and account suspension.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            3. Tournament Integrity & Match Verification
          </h2>
          <p className="mt-2">
            All official tournament results require dual-player score confirmation or moderator verification backed by full-time screenshot evidence. Submitting fabricated screenshots or manipulating network connections is a breach of the Fair Play Code.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            4. Permitted Marketplace Conduct
          </h2>
          <p className="mt-2">
            Only approved gaming hardware, accessories, coaching, digital graphics, and event passes may be listed. Selling game accounts, unauthorized currency, or wagering services is strictly prohibited.
          </p>
        </section>
      </div>
    </div>
  );
}
