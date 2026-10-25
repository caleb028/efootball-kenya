/**
 * Explicit Developer Sandbox Seed Script (`npm run db:seed:dev`)
 *
 * STRICT COMPLIANCE RULE (Section 35):
 * This script is NEVER executed automatically in production (`NODE_ENV === 'production'`).
 * Production environments start with a clean database containing only system categories,
 * ledger chart of accounts, and compliance feature flags.
 */

import { getDb } from "../src/lib/db";

function main() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "ABORTED: Dev sandbox seed is strictly prohibited in production (Section 35)."
    );
    process.exit(1);
  }
  getDb();
  console.log(
    "[eFootball Kenya] Local database ready. Register your first account via /register to receive SUPER_ADMIN, MODERATOR, and ORGANISER roles."
  );
}

main();
