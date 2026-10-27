import React from "react";
import { notFound } from "next/navigation";
import { getClanBySlugOrId } from "@/lib/services/clans-community";
import { getCurrentUser } from "@/lib/services/auth";
import { ClanDetailClient } from "@/components/clan/ClanDetailClient";

export default function ClanDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let clan = null;
  try {
    clan = getClanBySlugOrId(params.slug);
  } catch (err) {
    console.error("ClanDetailPage error:", err);
  }
  if (!clan) notFound();
  let user = null;
  try {
    user = getCurrentUser();
  } catch {}
  return <ClanDetailClient clan={clan} currentUser={user} />;
}
