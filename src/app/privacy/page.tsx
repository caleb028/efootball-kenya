import React from "react";

export const metadata = {
  title: "Privacy Policy & Data Protection | eFootball Kenya",
  description: "How eFootball Kenya protects player personal information, match evidence, and privacy under Kenyan data protection standards.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="badge-yellow mb-3 inline-block">PRIVACY & DATA PROTECTION</span>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-ef-grey">
        Aligned with the Kenya Data Protection Act, 2019
      </p>

      <div className="card-esports mt-8 space-y-6 p-6 text-sm leading-relaxed text-ef-grey">
        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            1. Information We Collect
          </h2>
          <p className="mt-2">
            We collect your chosen username, email address, optional phone number, county of residence, primary gaming platform, and competitive match history required to operate national and county rankings.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            2. Private Match Evidence Access Control
          </h2>
          <p className="mt-2">
            Screenshots and video links uploaded to a Match Room are restricted by server-side access controls (`PRIVATE_MATCH`). Only the two match participants and authorised platform moderators/organisers can view match evidence.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            3. Security & Session Control
          </h2>
          <p className="mt-2">
            Passwords are stored using cryptographic bcrypt hashes. Players can inspect and revoke active login sessions at any time from their Security Settings dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
