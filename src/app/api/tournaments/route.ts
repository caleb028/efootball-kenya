import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  createTournament,
  listTournaments,
  importCompetingTeamsAndGenerateFixtures,
} from "@/lib/services/tournaments";
import { TournamentFormatId } from "@/lib/constants/kenya";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournaments = listTournaments({
    status: searchParams.get("status") || undefined,
    platform: searchParams.get("platform") || undefined,
    category: searchParams.get("category") || undefined,
    format: searchParams.get("format") || undefined,
    search: searchParams.get("q") || undefined,
  });
  return NextResponse.json({ tournaments });
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to create a competition." }, { status: 401 });
    }

    const body = await req.json();
    const tournament = createTournament({
      title: String(body.title || ""),
      description: String(body.description || ""),
      category: String(body.category || "WEEKEND_CUP"),
      format: (body.format || "SINGLE_ELIMINATION") as TournamentFormatId,
      platform: String(body.platform || "MOBILE"),
      region: String(body.region || "National"),
      minParticipants: Number(body.minParticipants || 2),
      maxParticipants: Number(body.maxParticipants || 16),
      registrationDeadline: String(
        body.registrationDeadline || new Date(Date.now() + 86400_000).toISOString()
      ),
      startDate: String(body.startDate || new Date(Date.now() + 172800_000).toISOString()),
      entryRequirement: body.entryRequirement
        ? String(body.entryRequirement)
        : "Free Entry — Open to Verified Kenyan Players",
      prizeDetails: body.prizeDetails ? String(body.prizeDetails) : undefined,
      sponsorName: body.sponsorName ? String(body.sponsorName) : undefined,
      livestreamUrl: body.livestreamUrl ? String(body.livestreamUrl) : undefined,
      seedingMode: body.seedingMode === "RANDOM" ? "RANDOM" : "SEEDED",
      isFeatured: Boolean(body.isFeatured),
      matchDurationMins: Number(body.matchDurationMins || 10),
      rulesContent: body.rulesContent ? String(body.rulesContent) : undefined,
      disputePolicy: body.disputePolicy ? String(body.disputePolicy) : undefined,
      organiserId: user.id,
      status: String(body.status || "REGISTRATION_OPEN"),
    });

    // If competing teams were uploaded directly upon creation, auto-generate fixtures immediately!
    if (body.competingTeams) {
      let teams: string[] = [];
      if (Array.isArray(body.competingTeams)) {
        teams = body.competingTeams.map(String).map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof body.competingTeams === "string") {
        teams = body.competingTeams.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean);
      }
      if (teams.length >= 2) {
        const liveTournament = importCompetingTeamsAndGenerateFixtures(tournament.id, teams, user);
        return NextResponse.json({
          tournament: liveTournament,
          message: `Competition created with ${teams.length} teams! Fixtures generated automatically.`,
        });
      }
    }

    return NextResponse.json({ tournament, message: "Tournament created successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create tournament." },
      { status: 400 }
    );
  }
}
