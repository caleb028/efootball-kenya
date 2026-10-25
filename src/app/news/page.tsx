import React from "react";
import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { listArticles } from "@/lib/services/clans-community";

export default function NewsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const articles = listArticles({ categorySlug: searchParams.category });

  const categories = [
    { slug: "ALL", name: "All News" },
    { slug: "tournament-news", name: "Tournament News" },
    { slug: "player-spotlights", name: "Player Spotlights" },
    { slug: "gaming-tips", name: "Gaming Tips" },
    { slug: "formation-guides", name: "Formation Guides" },
    { slug: "match-highlights", name: "Match Highlights" },
    { slug: "community-news", name: "Community News" },
  ];

  const activeCategory = searchParams.category || "ALL";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-brand-royal/40 pb-6">
        <span className="esports-badge-yellow mb-2">Editorial & Tactical Hub</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
          eFootball Kenya News & Guides
        </h1>
        <p className="text-sm text-brand-grey mt-1">
          Tournament coverage, Kenyan player spotlights, formation meta guides, and community
          announcements.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/news?category=${c.slug}`}
            className={`px-4 py-2 rounded-lg font-display font-bold uppercase text-xs whitespace-nowrap ${
              activeCategory === c.slug
                ? "bg-brand-yellow text-brand-navy"
                : "bg-brand-darkBlue text-white/85 border border-brand-royal/40"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-3">
          <Newspaper className="w-10 h-10 text-brand-yellow mx-auto" />
          <div className="font-display font-bold text-xl uppercase text-white">
            No Articles Published in This Category Yet
          </div>
          <p className="text-xs text-brand-grey">
            Content Editors and Admins can publish news, formation guides, and spotlights from the
            Admin Content Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="esports-card-hover p-6 flex flex-col justify-between gap-4 block"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="esports-badge-blue">{a.categoryName}</span>
                  <span className="text-brand-grey">
                    {new Date(a.publishedAt).toLocaleDateString("en-KE")}
                  </span>
                </div>
                <h2 className="font-display font-bold text-2xl text-white leading-snug">
                  {a.title}
                </h2>
                <p className="text-xs text-brand-grey line-clamp-3">{a.excerpt}</p>
              </div>
              <div className="pt-3 border-t border-brand-royal/30 flex items-center justify-between text-xs text-brand-yellow font-bold">
                <span>By {a.authorUsername}</span>
                <span className="inline-flex items-center gap-1">
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
