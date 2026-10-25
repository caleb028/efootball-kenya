// ============================================================================
// eFootball Kenya — Genuine Elo Rating & Achievement Engine (Sections 13 & 14)
// ============================================================================

export interface EloCalculationInput {
  playerOneRating: number;
  playerTwoRating: number;
  playerOneScore: number;
  playerTwoScore: number;
  kFactor?: number;
  isFriendly?: boolean;
  isVerified?: boolean;
  alreadyProcessed?: boolean;
}

export interface EloCalculationResult {
  eligible: boolean;
  reason?: string;
  kFactor: number;
  playerOneExpected: number;
  playerTwoExpected: number;
  playerOneActual: number;
  playerTwoActual: number;
  playerOneOldRating: number;
  playerTwoOldRating: number;
  playerOneNewRating: number;
  playerTwoNewRating: number;
  playerOneDelta: number;
  playerTwoDelta: number;
}

/**
 * Expected result formula from Section 13:
 * E = 1 / (1 + 10^((OpponentRating - PlayerRating) / 400))
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  const exponent = (opponentRating - playerRating) / 400;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Determine actual match score value (1 = Win, 0.5 = Draw, 0 = Loss)
 */
export function getActualMatchOutcome(
  myGoals: number,
  opponentGoals: number
): { myActual: number; opponentActual: number } {
  if (myGoals > opponentGoals) {
    return { myActual: 1, opponentActual: 0 };
  }
  if (myGoals < opponentGoals) {
    return { myActual: 0, opponentActual: 1 };
  }
  return { myActual: 0.5, opponentActual: 0.5 };
}

/**
 * Compute new Elo ratings for a verified competitive match.
 * Enforces Section 13 & 16 rules:
 * - Friendly matches do not change official tournament ratings.
 * - Unverified matches do not change official ratings.
 * - Duplicate rating processing is strictly prevented.
 */
export function computeMatchEloUpdate(input: EloCalculationInput): EloCalculationResult {
  const kFactor = input.kFactor ?? 32;
  const p1Expected = calculateExpectedScore(input.playerOneRating, input.playerTwoRating);
  const p2Expected = calculateExpectedScore(input.playerTwoRating, input.playerOneRating);
  const { myActual: p1Actual, opponentActual: p2Actual } = getActualMatchOutcome(
    input.playerOneScore,
    input.playerTwoScore
  );

  if (input.alreadyProcessed) {
    return {
      eligible: false,
      reason: "Match rating has already been processed (idempotency guard).",
      kFactor,
      playerOneExpected: Number(p1Expected.toFixed(4)),
      playerTwoExpected: Number(p2Expected.toFixed(4)),
      playerOneActual: p1Actual,
      playerTwoActual: p2Actual,
      playerOneOldRating: input.playerOneRating,
      playerTwoOldRating: input.playerTwoRating,
      playerOneNewRating: input.playerOneRating,
      playerTwoNewRating: input.playerTwoRating,
      playerOneDelta: 0,
      playerTwoDelta: 0,
    };
  }

  if (input.isFriendly) {
    return {
      eligible: false,
      reason: "Friendly matches remain separate from official Elo rankings.",
      kFactor,
      playerOneExpected: Number(p1Expected.toFixed(4)),
      playerTwoExpected: Number(p2Expected.toFixed(4)),
      playerOneActual: p1Actual,
      playerTwoActual: p2Actual,
      playerOneOldRating: input.playerOneRating,
      playerTwoOldRating: input.playerTwoRating,
      playerOneNewRating: input.playerOneRating,
      playerTwoNewRating: input.playerTwoRating,
      playerOneDelta: 0,
      playerTwoDelta: 0,
    };
  }

  if (input.isVerified === false) {
    return {
      eligible: false,
      reason: "Only verified matches may update official Elo ratings.",
      kFactor,
      playerOneExpected: Number(p1Expected.toFixed(4)),
      playerTwoExpected: Number(p2Expected.toFixed(4)),
      playerOneActual: p1Actual,
      playerTwoActual: p2Actual,
      playerOneOldRating: input.playerOneRating,
      playerTwoOldRating: input.playerTwoRating,
      playerOneNewRating: input.playerOneRating,
      playerTwoNewRating: input.playerTwoRating,
      playerOneDelta: 0,
      playerTwoDelta: 0,
    };
  }

  const p1Delta = Math.round(kFactor * (p1Actual - p1Expected));
  const p2Delta = Math.round(kFactor * (p2Actual - p2Expected));

  const p1New = Math.max(100, input.playerOneRating + p1Delta);
  const p2New = Math.max(100, input.playerTwoRating + p2Delta);

  return {
    eligible: true,
    kFactor,
    playerOneExpected: Number(p1Expected.toFixed(4)),
    playerTwoExpected: Number(p2Expected.toFixed(4)),
    playerOneActual: p1Actual,
    playerTwoActual: p2Actual,
    playerOneOldRating: input.playerOneRating,
    playerTwoOldRating: input.playerTwoRating,
    playerOneNewRating: p1New,
    playerTwoNewRating: p2New,
    playerOneDelta: p1New - input.playerOneRating,
    playerTwoDelta: p2New - input.playerTwoRating,
  };
}

export interface PlayerStatsSummary {
  rating: number;
  wins: number;
  draws: number;
  losses: number;
  matchesPlayed: number;
  currentStreak: number;
  bestStreak: number;
  tournamentsWon: number;
  existingAchievementCodes: string[];
}

/**
 * Evaluate which achievements a player has unlocked from real verified stats.
 */
export function evaluateUnlockedAchievements(stats: PlayerStatsSummary): string[] {
  const existing = new Set(stats.existingAchievementCodes);
  const newlyUnlocked: string[] = [];

  if (stats.wins >= 1 && !existing.has("FIRST_WIN")) {
    newlyUnlocked.push("FIRST_WIN");
  }
  if (stats.wins >= 5 && !existing.has("FIVE_WINS")) {
    newlyUnlocked.push("FIVE_WINS");
  }
  if (stats.wins >= 10 && !existing.has("TEN_WINS")) {
    newlyUnlocked.push("TEN_WINS");
  }
  if (stats.bestStreak >= 5 && !existing.has("UNBEATEN_STREAK")) {
    newlyUnlocked.push("UNBEATEN_STREAK");
  }
  if (stats.tournamentsWon >= 1 && !existing.has("TOURNAMENT_CHAMPION")) {
    newlyUnlocked.push("TOURNAMENT_CHAMPION");
  }
  if (stats.rating >= 1350 && !existing.has("NATIONAL_CHALLENGER")) {
    newlyUnlocked.push("NATIONAL_CHALLENGER");
  }

  return newlyUnlocked;
}
