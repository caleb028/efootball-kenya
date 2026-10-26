import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/services/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: {
    default: "eFootball ARENA Kenya — Play. Compete. Belong. | Esports Tournaments & Rankings",
    template: "%s | eFootball ARENA Kenya",
  },
  description:
    "Kenya's premier competitive eFootball gaming and tournament platform. Play. Compete. Belong. Compete across Mobile, PlayStation, Xbox, and PC, earn verified national Elo rankings, and join clans across all 47 counties.",
  keywords: [
    "eFootball ARENA",
    "eFootball Kenya",
    "eFootball tournaments Kenya",
    "eFootball rankings Kenya",
    "Kenya esports eFootball",
    "eFootball clans Kenya",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "eFootball ARENA",
  },
  openGraph: {
    title: "eFootball ARENA Kenya — Play. Compete. Belong.",
    description:
      "Compete in verified tournaments, rise through the 47-county rankings, and battle Kenya's elite eFootball players.",
    siteName: "eFootball ARENA Kenya",
    locale: "en_KE",
    type: "website",
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#00189D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = getCurrentUser();
  let unreadNotifications = 0;
  if (user) {
    try {
      const db = getDb();
      const row = db
        .prepare(
          `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read_at IS NULL`
        )
        .get(user.id) as { cnt: number };
      unreadNotifications = Number(row?.cnt ?? 0);
    } catch {
      unreadNotifications = 0;
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&family=Oxanium:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-[#00189D] text-white min-h-screen flex flex-col antialiased selection:bg-[#FFFF00] selection:text-[#00189D]">
        <Navbar user={user} unreadNotifications={unreadNotifications} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
