import React from "react";
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/services/tournaments";
import { getCurrentUser } from "@/lib/services/auth";
import { MatchRoomClient } from "@/components/match/MatchRoomClient";

export default function MatchReportPage({
  params,
}: {
  params: { matchId: string };
}) {
  const user = getCurrentUser();
  const match = getMatchDetail(params.matchId, user);
  if (!match) notFound();
  return <MatchRoomClient match={match} currentUser={user} initialSection="REPORT" />;
}
