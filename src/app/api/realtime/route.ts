import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { getPlatformStats, getLiveAndRecentMatches, getLeaderboard } from "@/lib/services/rankings-players";
import { getTournamentBySlugOrId, getMatchDetail } from "@/lib/services/tournaments";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = getCurrentUser();
  const tournamentSlug = searchParams.get("tournament");
  const matchId = searchParams.get("match");

  const payload: Record<string, any> = {
    timestamp: new Date().toISOString(),
    stats: getPlatformStats(),
  };

  if (tournamentSlug) {
    payload.tournament = getTournamentBySlugOrId(tournamentSlug);
  } else if (matchId) {
    payload.match = getMatchDetail(matchId, user);
  } else {
    payload.liveMatches = getLiveAndRecentMatches(6);
    payload.topTen = getLeaderboard({ limit: 10 });
  }

  if (user) {
    const db = getDb();
    const unread = (
      db
        .prepare(
          `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read_at IS NULL`
        )
        .get(user.id) as { cnt: number }
    ).cnt;
    payload.unreadNotifications = Number(unread);
  }

  return NextResponse.json(payload);
}
