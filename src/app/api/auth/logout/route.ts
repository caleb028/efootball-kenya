import { NextRequest, NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE_NAME } from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    revokeSession(token);
  }
  const res = NextResponse.json({ message: "Logged out." });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
