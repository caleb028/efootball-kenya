import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://efootballkenya.co.ke";
  const now = new Date();

  const publicRoutes = [
    "",
    "/tournaments",
    "/rankings",
    "/players",
    "/clans",
    "/marketplace",
    "/community",
    "/news",
    "/highlights",
    "/sponsors",
    "/about",
    "/help",
    "/contact",
    "/fair-play",
    "/terms",
    "/privacy",
    "/refund-policy",
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/tournaments" || route === "/rankings" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
