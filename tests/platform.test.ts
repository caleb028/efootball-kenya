// ============================================================================
// eFootball Kenya — Comprehensive Unit, Integration & E2E Test Suite (Section 33)
// Runs natively via Node.js test runner + tsx (`npm test`)
// ============================================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetDatabaseForTests } from "../src/lib/db";
import {
  calculateExpectedScore,
  computeMatchEloUpdate,
  evaluateUnlockedAchievements,
} from "../src/lib/engine/elo";
import {
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket,
  generateRoundRobinFixtures,
  generateTournamentFixturesAndBrackets,
  calculateStandings,
  canAdvanceBracketMatch,
  seedParticipants,
} from "../src/lib/engine/bracket";
import {
  registerUser,
  authenticateUser,
  verifyEmailToken,
  createPasswordResetToken,
  resetPasswordWithToken,
  hasAnyRole,
} from "../src/lib/services/auth";
import {
  createTournament,
  registerForTournament,
  withdrawFromTournament,
  generateTournamentBracketAndStart,
  getTournamentBySlugOrId,
  checkInToMatch,
  submitMatchResult,
  uploadMatchEvidence,
  getMatchDetail,
  resolveDisputeByModerator,
} from "../src/lib/services/tournaments";
import {
  getLeaderboard,
  getPlayerProfileByUsername,
  getPlatformStats,
  createFriendlyChallenge,
  respondToFriendlyChallenge,
} from "../src/lib/services/rankings-players";
import { createClan, requestToJoinClan, manageClanMember } from "../src/lib/services/clans-community";
import {
  createMarketplaceListing,
  createMarketplaceOrder,
  createMpesaPaymentRequest,
  moderateUserAccount,
} from "../src/lib/services/marketplace-finance-admin";

describe("eFootball Kenya — Section 33 Automated Test Suite", () => {
  beforeEach(() => {
    resetDatabaseForTests();
  });

  // --------------------------------------------------------------------------
  // 1. UNIT TESTS: ELO ENGINE & ACHIEVEMENTS
  // --------------------------------------------------------------------------
  describe("Unit: Elo Rating & Achievement Calculations", () => {
    it("calculates expected score E = 1 / (1 + 10^((Opponent - Player)/400)) accurately", () => {
      assert.equal(Number(calculateExpectedScore(1200, 1200).toFixed(4)), 0.5);
      assert.equal(Number(calculateExpectedScore(1400, 1200).toFixed(3)), 0.76);
      assert.equal(Number(calculateExpectedScore(1200, 1400).toFixed(3)), 0.24);
    });

    it("computes correct Elo updates for verified matches and blocks friendly/unverified/duplicate matches", () => {
      const verified = computeMatchEloUpdate({
        playerOneRating: 1200,
        playerTwoRating: 1200,
        playerOneScore: 3,
        playerTwoScore: 1,
        kFactor: 32,
        isFriendly: false,
        isVerified: true,
      });
      assert.equal(verified.eligible, true);
      assert.equal(verified.playerOneNewRating, 1216);
      assert.equal(verified.playerTwoNewRating, 1184);
      assert.equal(verified.playerOneDelta, 16);
      assert.equal(verified.playerTwoDelta, -16);

      const friendly = computeMatchEloUpdate({
        playerOneRating: 1200,
        playerTwoRating: 1200,
        playerOneScore: 5,
        playerTwoScore: 0,
        isFriendly: true,
        isVerified: true,
      });
      assert.equal(friendly.eligible, false);
      assert.equal(friendly.playerOneNewRating, 1200);

      const duplicate = computeMatchEloUpdate({
        playerOneRating: 1200,
        playerTwoRating: 1200,
        playerOneScore: 2,
        playerTwoScore: 0,
        alreadyProcessed: true,
      });
      assert.equal(duplicate.eligible, false);
      assert.equal(duplicate.playerOneDelta, 0);
    });

    it("unlocks achievements strictly from verified player milestones", () => {
      const unlocked = evaluateUnlockedAchievements({
        rating: 1365,
        wins: 5,
        draws: 0,
        losses: 0,
        matchesPlayed: 5,
        currentStreak: 5,
        bestStreak: 5,
        tournamentsWon: 1,
        existingAchievementCodes: ["FIRST_WIN"],
      });
      assert.equal(unlocked.includes("FIVE_WINS"), true);
      assert.equal(unlocked.includes("UNBEATEN_STREAK"), true);
      assert.equal(unlocked.includes("TOURNAMENT_CHAMPION"), true);
      assert.equal(unlocked.includes("NATIONAL_CHALLENGER"), true);
      assert.equal(unlocked.includes("FIRST_WIN"), false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. UNIT TESTS: BRACKET GENERATION, BYES & STANDINGS
  // --------------------------------------------------------------------------
  describe("Unit: Automated Bracket & Standings Engine", () => {
    it("generates Single Elimination brackets with byes for odd participant counts and advances Round 1 byes", () => {
      const seeded = seedParticipants([
        { userId: "u1", username: "Kamau", rating: 1450 },
        { userId: "u2", username: "Ochieng", rating: 1380 },
        { userId: "u3", username: "Wanjiku", rating: 1310 },
      ]);
      const matches = generateSingleEliminationBracket(
        "t1",
        seeded,
        "2026-10-25T15:00:00.000Z"
      );
      assert.equal(matches.length, 3);
      const semis = matches.filter((m) => m.roundNumber === 1);
      const finalMatch = matches.find((m) => m.roundNumber === 2)!;

      const byeMatch = semis.find((m) => m.playerOneId === "u1")!;
      assert.equal(byeMatch.status, "COMPLETED");
      assert.equal(byeMatch.winnerId, "u1");
      assert.equal(finalMatch.playerOneId, "u1");
    });

    it("generates Double Elimination, Round Robin, and Group + Knockout structures", () => {
      const players = [
        { userId: "p1", username: "P1", rating: 1400 },
        { userId: "p2", username: "P2", rating: 1350 },
        { userId: "p3", username: "P3", rating: 1300 },
        { userId: "p4", username: "P4", rating: 1250 },
      ];
      const seeded = seedParticipants(players);

      const de = generateDoubleEliminationBracket("t_de", seeded, "2026-10-25T15:00:00.000Z");
      assert.equal(de.some((m) => m.bracketSide === "WINNERS"), true);
      assert.equal(de.some((m) => m.bracketSide === "LOSERS"), true);
      assert.equal(de.some((m) => m.bracketSide === "GRAND_FINAL"), true);

      const rr = generateRoundRobinFixtures("t_rr", seeded, "2026-10-25T15:00:00.000Z");
      assert.equal(rr.length, 6);

      const gko = generateTournamentFixturesAndBrackets(
        "t_gko",
        "GROUP_PLUS_KNOCKOUT",
        players,
        "SEEDED",
        "2026-10-25T15:00:00.000Z"
      );
      assert.equal(gko.groups.length, 2);
      assert.equal(gko.matches.some((m) => m.bracketSide === "GROUP"), true);
      assert.equal(gko.matches.some((m) => m.bracketSide === "WINNERS"), true);
    });

    it("prevents disputed or unverified matches from advancing in brackets", () => {
      assert.equal(
        canAdvanceBracketMatch({
          status: "DISPUTED",
          winnerId: "u1",
          playerOneScore: 2,
          playerTwoScore: 1,
        }).allowed,
        false
      );

      assert.equal(
        canAdvanceBracketMatch({
          status: "AWAITING_CONFIRMATION",
          winnerId: "u1",
          playerOneScore: 2,
          playerTwoScore: 1,
        }).allowed,
        false
      );

      assert.equal(
        canAdvanceBracketMatch({
          status: "COMPLETED",
          winnerId: "u1",
          playerOneScore: 2,
          playerTwoScore: 1,
        }).allowed,
        true
      );
    });

    it("calculates Round Robin standings with Points, Goal Difference, and Goals For tie-breakers", () => {
      const standings = calculateStandings(
        [
          { userId: "u1", username: "Alpha" },
          { userId: "u2", username: "Bravo" },
          { userId: "u3", username: "Charlie" },
        ],
        [
          {
            playerOneId: "u1",
            playerTwoId: "u2",
            playerOneScore: 2,
            playerTwoScore: 0,
            status: "COMPLETED",
          },
          {
            playerOneId: "u2",
            playerTwoId: "u3",
            playerOneScore: 3,
            playerTwoScore: 1,
            status: "COMPLETED",
          },
          {
            playerOneId: "u1",
            playerTwoId: "u3",
            playerOneScore: 1,
            playerTwoScore: 1,
            status: "DISPUTED",
          },
        ]
      );
      assert.equal(standings[0].userId, "u1");
      assert.equal(standings[1].userId, "u2");
      assert.equal(standings[2].userId, "u3");
    });
  });

  // --------------------------------------------------------------------------
  // 3. INTEGRATION & E2E TESTS: COMPLETE PLAYER & TOURNAMENT JOURNEY
  // --------------------------------------------------------------------------
  describe("E2E Journey: Register -> Tournament -> Fixtures -> Verify Score -> Bracket Advances -> Elo Updates", () => {
    it("completes the full tournament lifecycle with real database persistence and zero fabricated stats", async () => {
      const initialStats = getPlatformStats();
      assert.equal(initialStats.registeredPlayers, 0);
      assert.equal(initialStats.matchesCompleted, 0);

      const { user: organiser, verificationToken } = await registerUser({
        username: "OrganiserKE",
        displayName: "Kenya Esports Organiser",
        email: "organiser@efootballkenya.co.ke",
        password: "Password123!",
        county: "Nairobi",
        platform: "MOBILE",
        ageConfirmed: true,
        termsAccepted: true,
        initialRoles: ["ORGANISER", "MODERATOR", "TOURNAMENT_ADMIN", "SUPER_ADMIN"],
      });

      assert.equal(verifyEmailToken(verificationToken), true);
      assert.equal(hasAnyRole(organiser, ["ORGANISER"]), true);

      const { user: player1 } = await registerUser({
        username: "NairobiKing",
        displayName: "Brian Kamau",
        email: "brian@example.co.ke",
        password: "Password123!",
        county: "Nairobi",
        platform: "MOBILE",
        efootballId: "ASDF-111-222",
        ageConfirmed: true,
        termsAccepted: true,
      });

      const { user: player2 } = await registerUser({
        username: "MombasaStriker",
        displayName: "Hassan Ali",
        email: "hassan@example.co.ke",
        password: "Password123!",
        county: "Mombasa",
        platform: "MOBILE",
        efootballId: "ASDF-333-444",
        ageConfirmed: true,
        termsAccepted: true,
      });

      const { user: player3 } = await registerUser({
        username: "KisumuMaestro",
        displayName: "Kevin Omondi",
        email: "kevin@example.co.ke",
        password: "Password123!",
        county: "Kisumu",
        platform: "MOBILE",
        ageConfirmed: true,
        termsAccepted: true,
      });

      const tourney = createTournament({
        title: "Nairobi Weekend Quick Cup",
        description: "Official 1v1 Mobile knockout cup.",
        category: "WEEKEND_CUP",
        format: "SINGLE_ELIMINATION",
        platform: "MOBILE",
        region: "National",
        maxParticipants: 2,
        registrationDeadline: "2026-11-01T12:00:00.000Z",
        startDate: "2026-11-01T15:00:00.000Z",
        organiserId: organiser.id,
      });

      const reg1 = registerForTournament(tourney.slug, player1);
      assert.equal(reg1.status, "CONFIRMED");

      assert.throws(() => registerForTournament(tourney.slug, player1), /already registered/i);

      const reg2 = registerForTournament(tourney.slug, player2);
      assert.equal(reg2.status, "CONFIRMED");

      const reg3 = registerForTournament(tourney.slug, player3);
      assert.equal(reg3.status, "WAITLISTED");

      withdrawFromTournament(tourney.slug, player2);
      const updatedTourney = getTournamentBySlugOrId(tourney.slug)!;
      assert.equal(
        updatedTourney.participants.some((p) => p.username === "KisumuMaestro"),
        true
      );

      const startedTourney = generateTournamentBracketAndStart(tourney.slug, organiser);
      assert.equal(startedTourney.status, "IN_PROGRESS");
      assert.equal(startedTourney.matches.length, 1);

      const finalMatch = startedTourney.matches[0];
      assert.equal(finalMatch.status, "READY");

      checkInToMatch(finalMatch.id, player1);
      const afterBothCheckin = checkInToMatch(finalMatch.id, player3);
      assert.equal(afterBothCheckin.status, "IN_PROGRESS");

      uploadMatchEvidence({
        matchId: finalMatch.id,
        user: player1,
        fileType: "IMAGE",
        mimeType: "image/png",
        fileSize: 2048,
        storagePath: "/private/scoreboard1.png",
        caption: "Full-time 3-1 win screenshot",
      });

      const outsiderView = getMatchDetail(finalMatch.id, player2);
      assert.equal(outsiderView?.canViewPrivateEvidence, false);
      assert.equal(outsiderView?.evidence.length, 0);

      const participantView = getMatchDetail(finalMatch.id, player1);
      assert.equal(participantView?.canViewPrivateEvidence, true);
      assert.equal(participantView?.evidence.length, 1);

      const afterSub1 = submitMatchResult({
        matchId: finalMatch.id,
        user: player1,
        playerOneScore: 3,
        playerTwoScore: 1,
      });
      assert.equal(afterSub1.status, "AWAITING_CONFIRMATION");

      const afterSub2 = submitMatchResult({
        matchId: finalMatch.id,
        user: player3,
        playerOneScore: 3,
        playerTwoScore: 1,
      });
      assert.equal(afterSub2.status, "COMPLETED");
      assert.equal(afterSub2.winnerId, finalMatch.playerOneId);
      assert.equal(afterSub2.ratingProcessed, true);

      const leaderboard = getLeaderboard();
      assert.equal(leaderboard[0].username, finalMatch.playerOneUsername);
      assert.equal(leaderboard[0].rating, 1216);
      assert.equal(leaderboard[0].wins, 1);

      const p1Profile = getPlayerProfileByUsername(finalMatch.playerOneUsername!)!;
      assert.equal(p1Profile.championshipsWon, 1);
      assert.equal(
        p1Profile.achievements.some((a) => a.code === "FIRST_WIN"),
        true
      );
      assert.equal(
        p1Profile.achievements.some((a) => a.code === "TOURNAMENT_CHAMPION"),
        true
      );
    });

    it("detects conflicting match results, opens a dispute, prevents moderator conflict-of-interest, and resolves properly", async () => {
      const { user: modPlayer } = await registerUser({
        username: "ModPlayer",
        displayName: "Mod Player",
        email: "modplayer@efootballkenya.co.ke",
        password: "Password123!",
        county: "Nakuru",
        platform: "PLAYSTATION",
        ageConfirmed: true,
        termsAccepted: true,
        initialRoles: ["ORGANISER", "MODERATOR"],
      });

      const { user: opponent } = await registerUser({
        username: "EldoretAce",
        displayName: "Kiprop",
        email: "kiprop@efootballkenya.co.ke",
        password: "Password123!",
        county: "Uasin Gishu",
        platform: "PLAYSTATION",
        ageConfirmed: true,
        termsAccepted: true,
      });

      const { user: neutralMod } = await registerUser({
        username: "NeutralReferee",
        displayName: "Chief Referee",
        email: "referee@efootballkenya.co.ke",
        password: "Password123!",
        county: "Kiambu",
        platform: "PLAYSTATION",
        ageConfirmed: true,
        termsAccepted: true,
        initialRoles: ["MODERATOR"],
      });

      const cup = createTournament({
        title: "PS5 Rift Valley Clash",
        description: "1v1 PlayStation Cup",
        category: "DAILY_QUICK_CUP",
        format: "SINGLE_ELIMINATION",
        platform: "PLAYSTATION",
        maxParticipants: 4,
        registrationDeadline: "2026-11-01T12:00:00.000Z",
        startDate: "2026-11-01T15:00:00.000Z",
        organiserId: modPlayer.id,
      });

      registerForTournament(cup.slug, modPlayer);
      registerForTournament(cup.slug, opponent);
      const started = generateTournamentBracketAndStart(cup.slug, modPlayer);
      const matchId = started.matches[0].id;

      submitMatchResult({
        matchId,
        user: modPlayer,
        playerOneScore: 2,
        playerTwoScore: 0,
      });
      const conflicted = submitMatchResult({
        matchId,
        user: opponent,
        playerOneScore: 1,
        playerTwoScore: 2,
      });

      assert.equal(conflicted.status, "DISPUTED");
      assert.equal(conflicted.disputes.length, 1);
      const disputeId = conflicted.disputes[0].id;

      assert.throws(
        () =>
          resolveDisputeByModerator({
            disputeId,
            moderator: modPlayer,
            ruling: "CONFIRM_SCORE",
            playerOneScore: 2,
            playerTwoScore: 0,
            reasoning: "Trying to rule on my own match",
          }),
        /Conflict of Interest/i
      );

      resolveDisputeByModerator({
        disputeId,
        moderator: neutralMod,
        ruling: "CONFIRM_SCORE",
        playerOneScore: 1,
        playerTwoScore: 2,
        reasoning: "Verified opponent scoreboard screenshot.",
      });

      const resolvedMatch = getMatchDetail(matchId, neutralMod)!;
      assert.equal(resolvedMatch.status, "COMPLETED");
      assert.equal(resolvedMatch.winnerId, resolvedMatch.playerTwo?.id);
    });

    it("enforces security, suspended account blocking, marketplace prohibitions, clans, and compliance gates", async () => {
      const { user: admin } = await registerUser({
        username: "SuperAdminKE",
        displayName: "Super Admin",
        email: "admin@efootballkenya.co.ke",
        password: "Password123!",
        county: "Nairobi",
        platform: "PC",
        ageConfirmed: true,
        termsAccepted: true,
        initialRoles: ["SUPER_ADMIN"],
      });

      const { user: seller } = await registerUser({
        username: "CoachOliech",
        displayName: "Dennis Oliech",
        email: "coach@efootballkenya.co.ke",
        password: "Password123!",
        county: "Nairobi",
        platform: "PLAYSTATION",
        ageConfirmed: true,
        termsAccepted: true,
      });

      const listing = createMarketplaceListing({
        user: seller,
        categorySlug: "gaming-coaching",
        title: "Pro 1-on-1 eFootball Tactical & Defensive Transition Session",
        description: "60-minute live coaching session covering formation meta and manual pressing.",
        priceKes: 1500,
        fulfilmentTerms: "Delivered via Discord/PS Party within 24 hours of booking.",
      });
      assert.equal(listing.priceKes, 1500);

      assert.throws(
        () =>
          createMarketplaceListing({
            user: seller,
            categorySlug: "approved-gaming-services",
            title: "Epic Stacked Account For Sale with 3200 Team Strength",
            description: "Full Konami ID login credential handover.",
            priceKes: 5000,
            fulfilmentTerms: "Instant login transfer",
          }),
        /Prohibited Listing Policy/i
      );

      const orderId = createMarketplaceOrder({
        listingId: listing.id,
        buyer: admin,
        buyerNotes: "Available Saturday afternoon EAT",
      });
      assert.ok(orderId);

      const pay1 = createMpesaPaymentRequest({
        user: admin,
        idempotencyKey: "idem-key-001",
        purpose: "MARKETPLACE_ORDER",
        referenceId: orderId,
        phoneNumber: "254712345678",
        amountKes: 1500,
      });
      assert.equal(pay1.status, "DISABLED_BY_COMPLIANCE");
      assert.equal(pay1.idempotentReplay, false);

      const pay2 = createMpesaPaymentRequest({
        user: admin,
        idempotencyKey: "idem-key-001",
        purpose: "MARKETPLACE_ORDER",
        referenceId: orderId,
        phoneNumber: "254712345678",
        amountKes: 1500,
      });
      assert.equal(pay2.idempotentReplay, true);
      assert.equal(pay2.id, pay1.id);

      const clan = createClan({
        founder: seller,
        name: "Nairobi Royals Esports",
        tag: "NRB",
        county: "Nairobi",
        description: "Premier Nairobi competitive eFootball squad.",
      });
      assert.equal(clan.tag, "NRB");
      requestToJoinClan(clan.slug, admin);
      const updatedClan = manageClanMember({
        clanIdOrSlug: clan.slug,
        actor: seller,
        targetUserId: admin.id,
        action: "APPROVE",
      });
      assert.equal(updatedClan.members.length, 2);

      const challengeId = createFriendlyChallenge({
        challenger: seller,
        opponentUsername: admin.username,
        platform: "PLAYSTATION",
        proposedTime: "2026-11-02T18:00:00.000Z",
        message: "Warmup match?",
      });
      const accepted = respondToFriendlyChallenge({
        challengeId,
        user: admin,
        decision: "ACCEPTED",
      });
      assert.ok(accepted.matchId);

      const resetToken = createPasswordResetToken(seller.email);
      assert.ok(resetToken);
      assert.equal(await resetPasswordWithToken(resetToken!, "NewStrongPass99!"), true);

      moderateUserAccount({
        admin,
        targetUserId: seller.id,
        action: "SUSPEND",
        reason: "Fair play investigation",
      });

      await assert.rejects(
        () =>
          authenticateUser({
            identifier: seller.username,
            password: "NewStrongPass99!",
          }),
        /suspended/i
      );
    });
  });
});
