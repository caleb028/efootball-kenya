import React from "react";
import { notFound } from "next/navigation";
import { getTournamentBySlugOrId } from "@/lib/services/tournaments";
import { getCurrentUser } from "@/lib/services/auth";
import { TournamentDetailClient } from "@/components/tournament/TournamentDetailClient";

export default function TournamentBracketPage({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = getTournamentBySlugOrId(params.slug);
  if (!tournament) notFound();
  const user = getCurrentUser();
  return <TournamentDetailClient tournament={tournament} currentUser={user} initialTab="BRACKET" />;
}
