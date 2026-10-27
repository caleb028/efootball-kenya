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
  let user = null;
  try {
    user = getCurrentUser();
  } catch {}

  let match = null;
  try {
    match = getMatchDetail(params.matchId, user);
  } catch (err) {
    console.error("MatchReportPage error:", err);
  }
  if (!match) notFound();
  return <MatchRoomClient match={match} currentUser={user} initialSection="REPORT" />;
}
