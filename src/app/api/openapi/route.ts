import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "eFootball Kenya — Competitive Gaming & Tournament Ecosystem API",
      version: "1.0.0",
      description:
        "REST API architecture for the eFootball Kenya web application, PWA, and future Android/iOS React Native mobile apps.",
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        description: "eFootball Kenya API Server (Africa/Nairobi)",
      },
    ],
    paths: {
      "/api/auth/register": {
        post: {
          summary: "Register a new Kenyan eFootball player account",
          tags: ["Authentication"],
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Authenticate with username/email and password",
          tags: ["Authentication"],
        },
      },
      "/api/auth/me": {
        get: { summary: "Get current authenticated session profile", tags: ["Authentication"] },
        patch: { summary: "Update player profile or notification state", tags: ["Authentication"] },
      },
      "/api/tournaments": {
        get: { summary: "List tournaments with platform, format, and category filters", tags: ["Tournaments"] },
        post: { summary: "Create a new tournament (Organiser / Admin RBAC)", tags: ["Tournaments"] },
      },
      "/api/tournaments/{slug}": {
        get: { summary: "Get tournament overview, participants, brackets, fixtures, and standings", tags: ["Tournaments"] },
        post: { summary: "Register, withdraw, generate bracket, or publish announcement", tags: ["Tournaments"] },
      },
      "/api/matches/{matchId}": {
        get: { summary: "Get Match Room details and authorised private evidence", tags: ["Matches"] },
        post: { summary: "Check-in, submit score, upload private proof, open or appeal dispute", tags: ["Matches"] },
      },
      "/api/rankings": {
        get: { summary: "Query National, 47-County, Platform, University, and Clan Elo leaderboards", tags: ["Rankings"] },
      },
      "/api/players/{username}": {
        get: { summary: "Get public player profile, verified stats, match history, and badges", tags: ["Players"] },
        post: { summary: "Follow player or send friendly challenge", tags: ["Players"] },
      },
      "/api/clans": {
        get: { summary: "List clans by county and rating", tags: ["Clans"] },
        post: { summary: "Create clan, request join, manage members, or post announcement", tags: ["Clans"] },
      },
      "/api/community": {
        get: { summary: "List community activity feed, news articles, and match highlights", tags: ["Community"] },
        post: { summary: "Post highlight, comment, react, report, or respond to friendly challenge", tags: ["Community"] },
      },
      "/api/marketplace": {
        get: { summary: "List permitted KES gaming marketplace listings and user orders", tags: ["Marketplace"] },
        post: { summary: "Create permitted listing, place order, or update fulfilment status", tags: ["Marketplace"] },
      },
      "/api/finance": {
        get: { summary: "Inspect double-entry ledger accounts and regulatory compliance feature flags", tags: ["Finance"] },
        post: { summary: "Create idempotent M-Pesa payment request (gated by compliance flags)", tags: ["Finance"] },
      },
      "/api/admin": {
        get: { summary: "Admin dashboard metrics, dispute queue, users, and audit logs (RBAC)", tags: ["Admin"] },
        post: { summary: "Moderate player, adjudicate dispute, review listing, or manage sponsors", tags: ["Admin"] },
      },
      "/api/realtime": {
        get: { summary: "Real-time live match, bracket, notification, and leaderboard state channel", tags: ["Realtime"] },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
