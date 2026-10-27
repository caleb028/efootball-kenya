import { getDb } from "../src/lib/db";

const db = getDb();
const tables = [
  "users",
  "profiles",
  "tournaments",
  "tournament_matches",
  "tournament_registrations",
  "clans",
  "clan_members",
  "marketplace_listings",
  "articles",
  "sponsors",
  "feature_flags",
  "sessions",
  "notifications",
];

for (const t of tables) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as any;
    console.log(`${t.padEnd(28)}: ${row.c}`);
  } catch (e: any) {
    console.log(`${t.padEnd(28)}: ERROR ${e.message}`);
  }
}
