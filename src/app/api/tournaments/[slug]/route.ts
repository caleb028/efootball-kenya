import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  getTournamentBySlugOrId,
  registerForTournament,
  withdrawFromTournament,
  generateTournamentBracketAndStart,
  importCompetingTeamsAndGenerateFixtures,
  postTournamentAnnouncement,
} from "@/lib/services/tournaments";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const tournament = getTournamentBySlugOrId(params.slug);
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }
  return NextResponse.json({ tournament });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "REGISTER");

    if (action === "REGISTER") {
      const teamName = body.teamName ? String(body.teamName).trim() : undefined;
      const result = registerForTournament(params.slug, user, teamName);
      return NextResponse.json({
        ...result,
        message:
          result.status === "CONFIRMED"
            ? `Registration confirmed! Team: ${teamName || user.username}`
            : "Tournament is full — you have been added to the official waitlist.",
      });
    }

    if (action === "IMPORT_TEAMS_AND_GENERATE_FIXTURES") {
      let teams: string[] = [];
      if (Array.isArray(body.teams)) {
        teams = body.teams.map(String).map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof body.teams === "string") {
        teams = body.teams.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean);
      }
      const tournament = importCompetingTeamsAndGenerateFixtures(params.slug, teams, user);
      return NextResponse.json({
        tournament,
        message: `Imported ${teams.length} competing teams and generated all fixtures! Competition is now IN PROGRESS.`,
      });
    }

    if (action === "WITHDRAW") {
      const result = withdrawFromTournament(params.slug, user);
      return NextResponse.json({
        ...result,
        message: "You have withdrawn from this tournament.",
      });
    }

    if (action === "GENERATE_BRACKET") {
      const tournament = generateTournamentBracketAndStart(params.slug, user);
      return NextResponse.json({
        tournament,
        message: "Automated brackets and fixtures generated! Tournament is now IN PROGRESS.",
      });
    }

    if (action === "ANNOUNCEMENT") {
      postTournamentAnnouncement({
        tournamentId: params.slug,
        author: user,
        title: String(body.title || ""),
        content: String(body.content || ""),
      });
      return NextResponse.json({ ok: true, message: "Announcement published." });
    }

    return NextResponse.json({ error: "Unsupported tournament action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
