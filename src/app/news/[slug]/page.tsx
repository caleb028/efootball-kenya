import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/services/clans-community";

export default function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let article = null;
  try {
    article = getArticleBySlug(params.slug);
  } catch (err) {
    console.error("ArticleDetailPage error:", err);
  }
  if (!article) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <Link href="/news" className="text-xs font-bold text-brand-yellow hover:underline">
          ← Back to News & Guides
        </Link>
        <div className="mt-3 space-y-2">
          <span className="esports-badge-yellow">{article.categoryName}</span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl uppercase text-white leading-tight">
            {article.title}
          </h1>
          <div className="text-xs text-brand-grey">
            By <strong className="text-white">{article.authorUsername}</strong> • Published{" "}
            {new Date(article.publishedAt).toLocaleDateString("en-KE")}
          </div>
        </div>
      </div>

      {article.videoEmbed && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-brand-navy border-2 border-brand-royal">
          <iframe
            src={article.videoEmbed}
            title={article.title}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}

      <div className="esports-card p-6 sm:p-8 text-sm sm:text-base text-white/90 whitespace-pre-line leading-relaxed">
        {article.content}
      </div>
    </div>
  );
}
