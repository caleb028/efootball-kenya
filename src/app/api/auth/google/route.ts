import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

  if (!clientId) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Google OAuth is not active until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured in environment variables (.env.local).",
      },
      { status: 503 }
    );
  }

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");

  return NextResponse.redirect(googleUrl.toString());
}
