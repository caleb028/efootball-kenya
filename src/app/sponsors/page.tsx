import React from "react";
import Link from "next/link";
import { Award, Megaphone, BarChart3, CheckCircle2 } from "lucide-react";
import { listSponsorsAndCampaigns } from "@/lib/services/marketplace-finance-admin";

export default function SponsorsPage() {
  const { sponsors, campaigns } = listSponsorsAndCampaigns();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-brand-royal/40 pb-6">
        <span className="esports-badge-yellow mb-2">Brand Partnerships</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
          Sponsorship & Advertising on eFootball Kenya
        </h1>
        <p className="text-sm text-brand-grey mt-1 max-w-3xl">
          Partner with Kenya&apos;s competitive football gaming community through tournament naming
          rights, county championships, university leagues, and livestream placements.
        </p>
      </div>

      {/* Sponsorship Opportunities (Section 21) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Tournament & Cup Sponsorship",
            desc: "Brand the Monthly Kenya Open, Weekend Cups, or University Championships with official naming rights and bracket integration.",
          },
          {
            title: "County & Clan Sponsorship",
            desc: "Support grassroots esports across all 47 Kenyan counties and verified competitive clans.",
          },
          {
            title: "Livestream & Homepage Placements",
            desc: "Clearly labelled sponsored placements with real, database-verified impression and click tracking.",
          },
        ].map((item) => (
          <div key={item.title} className="esports-card p-6 space-y-3">
            <Award className="w-8 h-8 text-brand-yellow" />
            <h2 className="font-display font-bold text-2xl uppercase text-white">{item.title}</h2>
            <p className="text-xs text-brand-grey leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Active Sponsors & Real Recorded Campaign Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
            Active Partners & Sponsored Campaigns
          </h2>
          <span className="text-xs text-brand-grey">Sponsored Content Clearly Labelled</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="esports-card p-8 text-center space-y-3">
            <p className="text-sm text-brand-grey">
              No active sponsor campaigns are running right now. Interested brands can reach out via
              our Partnerships Desk.
            </p>
            <Link href="/contact" className="btn-yellow text-xs">
              Inquire About Sponsorship
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {campaigns.map((c) => (
              <div key={c.id} className="esports-card p-6 space-y-3 border-brand-yellow/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="esports-badge-yellow">SPONSORED • {c.sponsorTier}</span>
                  <span className="text-brand-grey">{c.placement}</span>
                </div>
                <h3 className="font-display font-bold text-2xl text-white">
                  {c.sponsorName} — {c.title}
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-brand-navy border border-brand-royal/40">
                    <span className="text-brand-grey block">Recorded Impressions</span>
                    <span className="font-display font-bold text-xl text-white">
                      {c.impressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-brand-navy border border-brand-royal/40">
                    <span className="text-brand-grey block">Recorded Clicks</span>
                    <span className="font-display font-bold text-xl text-brand-yellow">
                      {c.clicks.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
