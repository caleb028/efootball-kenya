import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  getMatchDetail,
  checkInToMatch,
  submitMatchResult,
  uploadMatchEvidence,
  openMatchDispute,
  submitDisputeAppeal,
} from "@/lib/services/tournaments";

export async function GET(
  _req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const viewer = getCurrentUser();
  const match = getMatchDetail(params.matchId, viewer);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  return NextResponse.json({ match });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "CHECKIN") {
      const match = checkInToMatch(params.matchId, user);
      return NextResponse.json({ match, message: "Checked in to Match Room." });
    }

    if (action === "SUBMIT_RESULT") {
      const match = submitMatchResult({
        matchId: params.matchId,
        user,
        playerOneScore: Number(body.playerOneScore),
        playerTwoScore: Number(body.playerTwoScore),
        notes: body.notes ? String(body.notes) : undefined,
        evidenceCaption: body.evidenceCaption ? String(body.evidenceCaption) : undefined,
        evidenceDataUrl: body.evidenceDataUrl ? String(body.evidenceDataUrl) : undefined,
      });

      const msg =
        match.status === "COMPLETED"
          ? "Scores matched! Result verified, Elo ratings updated, and bracket advanced."
          : match.status === "DISPUTED"
          ? "Conflicting scores detected — a Dispute has been opened for Moderator review."
          : "Score submitted! Waiting for opponent confirmation.";

      return NextResponse.json({ match, message: msg });
    }

    if (action === "UPLOAD_EVIDENCE") {
      const match = uploadMatchEvidence({
        matchId: params.matchId,
        user,
        fileType: body.fileType === "VIDEO" ? "VIDEO" : "IMAGE",
        mimeType: String(body.mimeType || "image/png"),
        fileSize: Number(body.fileSize || 1024),
        storagePath: String(body.storagePath || ""),
        caption: body.caption ? String(body.caption) : undefined,
      });
      return NextResponse.json({ match, message: "Private match evidence uploaded." });
    }

    if (action === "OPEN_DISPUTE") {
      const disputeId = openMatchDispute({
        matchId: params.matchId,
        user,
        category: String(body.category || "CONFLICTING_SCORES"),
        description: String(body.description || ""),
        evidenceStoragePath: body.evidenceStoragePath ? String(body.evidenceStoragePath) : undefined,
      });
      const match = getMatchDetail(params.matchId, user);
      return NextResponse.json({
        disputeId,
        match,
        message: "Dispute submitted for Moderator review.",
      });
    }

    if (action === "APPEAL_DISPUTE") {
      submitDisputeAppeal({
        disputeId: String(body.disputeId || ""),
        user,
        reason: String(body.reason || ""),
      });
      const match = getMatchDetail(params.matchId, user);
      return NextResponse.json({ match, message: "Dispute appeal submitted." });
    }

    return NextResponse.json({ error: "Unsupported match action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
