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
  const clan = getClanBySlugOrId(params.slug);
  if (!clan) notFound();
  const user = getCurrentUser();
  return <ClanDetailClient clan={clan} currentUser={user} />;
}
