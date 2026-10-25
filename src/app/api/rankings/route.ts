import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/services/rankings-players";
import { listClans } from "@/lib/services/clans-community";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "NATIONAL";

  if (tab === "CLANS") {
    const clans = listClans({
      county: searchParams.get("county") || undefined,
      search: searchParams.get("q") || undefined,
    });
    return NextResponse.json({ clans });
  }

  const leaderboard = getLeaderboard({
    county: searchParams.get("county") || undefined,
    platform: searchParams.get("platform") || undefined,
    universityOnly: tab === "UNIVERSITY",
    university: searchParams.get("university") || undefined,
    search: searchParams.get("q") || undefined,
    limit: Number(searchParams.get("limit") || 100),
    offset: Number(searchParams.get("offset") || 0),
  });

  return NextResponse.json({ leaderboard });
}
