import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  listCommunityEvents,
  createCommunityPost,
  addCommunityComment,
  toggleCommunityReaction,
  submitModerationReport,
  listArticles,
} from "@/lib/services/clans-community";
import {
  createFriendlyChallenge,
  respondToFriendlyChallenge,
} from "@/lib/services/rankings-players";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const viewer = getCurrentUser();
  const type = searchParams.get("type") || "feed";

  if (type === "articles") {
    const articles = listArticles({
      categorySlug: searchParams.get("category") || undefined,
      highlightsOnly: searchParams.get("highlights") === "1",
    });
    return NextResponse.json({ articles });
  }

  const events = listCommunityEvents(30, viewer?.id);
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "POST") {
      const id = createCommunityPost({
        author: user,
        eventType: String(body.eventType || "HIGHLIGHT"),
        title: String(body.title || ""),
        body: String(body.body || ""),
        linkUrl: body.linkUrl ? String(body.linkUrl) : undefined,
      });
      return NextResponse.json({ id, message: "Community highlight published!" });
    }

    if (action === "COMMENT") {
      const id = addCommunityComment({
        eventId: String(body.eventId || ""),
        author: user,
        content: String(body.content || ""),
      });
      return NextResponse.json({ id, message: "Comment added." });
    }

    if (action === "REACT") {
      const res = toggleCommunityReaction(String(body.eventId || ""), user.id);
      return NextResponse.json(res);
    }

    if (action === "REPORT") {
      const id = submitModerationReport({
        reporter: user,
        targetType: body.targetType || "COMMENT",
        targetId: String(body.targetId || ""),
        reason: String(body.reason || ""),
        details: body.details ? String(body.details) : undefined,
      });
      return NextResponse.json({
        id,
        message: "Report submitted to the Moderation Team.",
      });
    }

    if (action === "CHALLENGE_CREATE") {
      const id = createFriendlyChallenge({
        challenger: user,
        opponentUsername: String(body.opponentUsername || ""),
        platform: String(body.platform || user.platform),
        proposedTime: String(
          body.proposedTime || new Date(Date.now() + 3600_000).toISOString()
        ),
        message: body.message ? String(body.message) : undefined,
      });
      return NextResponse.json({
        id,
        message: `Friendly challenge sent to ${body.opponentUsername}!`,
      });
    }

    if (action === "CHALLENGE_RESPOND") {
      const res = respondToFriendlyChallenge({
        challengeId: String(body.challengeId || ""),
        user,
        decision: body.decision === "ACCEPTED" ? "ACCEPTED" : "DECLINED",
      });
      return NextResponse.json({
        ...res,
        message:
          res.status === "ACCEPTED"
            ? "Challenge accepted! Match room created."
            : "Challenge declined.",
      });
    }

    return NextResponse.json({ error: "Unsupported community action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
