import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  getPlayerProfileByUsername,
  toggleFollowPlayer,
  createFriendlyChallenge,
} from "@/lib/services/rankings-players";

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const viewer = getCurrentUser();
  const profile = getPlayerProfileByUsername(params.username, viewer?.id);
  if (!profile) {
    return NextResponse.json({ error: "Player profile not found." }, { status: 404 });
  }
  return NextResponse.json({ profile });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "FOLLOW") {
      const res = toggleFollowPlayer(user.id, params.username);
      return NextResponse.json({
        ...res,
        message: res.following
          ? `You are now following ${params.username}.`
          : `Unfollowed ${params.username}.`,
      });
    }

    if (action === "CHALLENGE") {
      const challengeId = createFriendlyChallenge({
        challenger: user,
        opponentUsername: params.username,
        platform: String(body.platform || user.platform),
        proposedTime: String(
          body.proposedTime || new Date(Date.now() + 3600_000).toISOString()
        ),
        message: body.message ? String(body.message) : undefined,
      });
      return NextResponse.json({
        challengeId,
        message: `Friendly challenge sent to ${params.username}!`,
      });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
