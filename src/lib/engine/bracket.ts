// ============================================================================
// eFootball Kenya — Automated Bracket, Fixture & Standings Engine (Sections 9–11)
// ============================================================================

import { TournamentFormatId } from "@/lib/constants/kenya";

export interface BracketParticipant {
  userId: string;
  username: string;
  rating: number;
  seed?: number;
}

export interface GeneratedMatchNode {
  id: string;
  roundNumber: number;
  roundLabel: string;
  matchNumber: number;
  bracketSide: "WINNERS" | "LOSERS" | "GRAND_FINAL" | "GROUP" | "LEAGUE";
  groupId?: string | null;
  groupName?: string | null;
  playerOneId: string | null;
  playerTwoId: string | null;
  playerOneScore: number | null;
  playerTwoScore: number | null;
  winnerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 1 | 2 | null;
  loserNextMatchId?: string | null;
  loserNextMatchSlot?: 1 | 2 | null;
  status:
    | "SCHEDULED"
    | "READY"
    | "IN_PROGRESS"
    | "AWAITING_RESULTS"
    | "AWAITING_CONFIRMATION"
    | "DISPUTED"
    | "COMPLETED"
    | "WALKOVER"
    | "CANCELLED";
  scheduledAt: string;
}

export interface GeneratedGroup {
  id: string;
  name: string;
  orderIndex: number;
  participantIds: string[];
}

export interface GeneratedTournamentStructure {
  format: TournamentFormatId;
  seededParticipants: Array<BracketParticipant & { seed: number }>;
  groups: GeneratedGroup[];
  matches: GeneratedMatchNode[];
}

/**
 * Compute next power of 2 >= n (minimum 2)
 */
export function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let power = 2;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Standard tournament seeding order for a bracket of size `bracketSize` (power of 2).
 * Ensures Seed 1 and Seed 2 only meet in the Final, Seed 1 plays Seed N (or a Bye) in Round 1.
 */
export function generateStandardSeedOrder(bracketSize: number): number[] {
  let rounds = Math.log2(bracketSize);
  let pls = [1, 2];
  for (let i = 0; i < rounds - 1; i++) {
    const out: number[] = [];
    const length = pls.length * 2 + 1;
    for (const d of pls) {
      out.push(d);
      out.push(length - d);
    }
    pls = out;
  }
  return pls;
}

/**
 * Determine human-readable round label for knockout brackets
 */
export function getKnockoutRoundLabel(
  roundIndex: number,
  totalRounds: number,
  bracketSide: "WINNERS" | "LOSERS" | "GRAND_FINAL" = "WINNERS"
): string {
  if (bracketSide === "GRAND_FINAL") return "Grand Final";
  if (bracketSide === "LOSERS") {
    return roundIndex === totalRounds ? "Losers Final" : `Losers Round ${roundIndex}`;
  }
  const remaining = totalRounds - roundIndex;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semi-Finals";
  if (remaining === 2) return "Quarter-Finals";
  const playersInRound = Math.pow(2, remaining + 1);
  return `Round of ${playersInRound}`;
}

/**
 * Seed participants either by Elo rating descending ("SEEDED") or deterministic/random shuffle ("RANDOM").
 */
export function seedParticipants(
  participants: BracketParticipant[],
  mode: "SEEDED" | "RANDOM" = "SEEDED"
): Array<BracketParticipant & { seed: number }> {
  const copy = [...participants];
  if (mode === "SEEDED") {
    copy.sort((a, b) => b.rating - a.rating || a.username.localeCompare(b.username));
  } else {
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
  }
  return copy.map((p, idx) => ({ ...p, seed: idx + 1 }));
}

/**
 * Generate Single Elimination Bracket with full Bye support and auto-advancement of Round 1 Byes.
 */
export function generateSingleEliminationBracket(
  tournamentId: string,
  participants: Array<BracketParticipant & { seed: number }>,
  baseStartDateIso: string
): GeneratedMatchNode[] {
  if (participants.length < 2) {
    throw new Error("At least 2 participants are required to generate a bracket.");
  }

  const bracketSize = nextPowerOfTwo(participants.length);
  const totalRounds = Math.log2(bracketSize);
  const seedOrder = generateStandardSeedOrder(bracketSize);
  const seedMap = new Map<number, BracketParticipant & { seed: number }>();
  for (const p of participants) {
    seedMap.set(p.seed, p);
  }

  const matchesByRound: GeneratedMatchNode[][] = [];
  const startMs = new Date(baseStartDateIso).getTime() || Date.now();

  for (let r = 1; r <= totalRounds; r++) {
    const numMatches = bracketSize / Math.pow(2, r);
    const roundLabel = getKnockoutRoundLabel(r, totalRounds, "WINNERS");
    const roundMatches: GeneratedMatchNode[] = [];

    for (let m = 1; m <= numMatches; m++) {
      roundMatches.push({
        id: `${tournamentId}-se-r${r}-m${m}`,
        roundNumber: r,
        roundLabel,
        matchNumber: m,
        bracketSide: "WINNERS",
        playerOneId: null,
        playerTwoId: null,
        playerOneScore: null,
        playerTwoScore: null,
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: null,
        status: "SCHEDULED",
        scheduledAt: new Date(startMs + (r - 1) * 3600 * 1000 * 2).toISOString(),
      });
    }
    matchesByRound.push(roundMatches);
  }

  // Link each round match to its next round match
  for (let r = 0; r < totalRounds - 1; r++) {
    const currentRound = matchesByRound[r];
    const nextRound = matchesByRound[r + 1];
    for (let i = 0; i < currentRound.length; i++) {
      const targetMatch = nextRound[Math.floor(i / 2)];
      currentRound[i].nextMatchId = targetMatch.id;
      currentRound[i].nextMatchSlot = i % 2 === 0 ? 1 : 2;
    }
  }

  // Populate Round 1 and handle Byes
  const roundOne = matchesByRound[0];
  for (let i = 0; i < roundOne.length; i++) {
    const seedA = seedOrder[i * 2];
    const seedB = seedOrder[i * 2 + 1];
    const playerA = seedMap.get(seedA) ?? null;
    const playerB = seedMap.get(seedB) ?? null;
    const match = roundOne[i];

    match.playerOneId = playerA ? playerA.userId : null;
    match.playerTwoId = playerB ? playerB.userId : null;

    if (match.playerOneId && match.playerTwoId) {
      match.status = "READY";
    } else if (match.playerOneId && !match.playerTwoId) {
      // Automatic Bye progression
      match.playerOneScore = 1;
      match.playerTwoScore = 0;
      match.winnerId = match.playerOneId;
      match.status = "COMPLETED";
    } else if (!match.playerOneId && match.playerTwoId) {
      match.playerOneScore = 0;
      match.playerTwoScore = 1;
      match.winnerId = match.playerTwoId;
      match.status = "COMPLETED";
    }
  }

  // Advance any Round 1 Bye winners into Round 2 slots immediately
  if (totalRounds > 1) {
    const roundTwo = matchesByRound[1];
    const r2Map = new Map(roundTwo.map((m) => [m.id, m]));
    for (const m of roundOne) {
      if (m.status === "COMPLETED" && m.winnerId && m.nextMatchId) {
        const nextMatch = r2Map.get(m.nextMatchId);
        if (nextMatch) {
          if (m.nextMatchSlot === 1) nextMatch.playerOneId = m.winnerId;
          if (m.nextMatchSlot === 2) nextMatch.playerTwoId = m.winnerId;
          if (nextMatch.playerOneId && nextMatch.playerTwoId) {
            nextMatch.status = "READY";
          }
        }
      }
    }
  }

  return matchesByRound.flat();
}

/**
 * Generate Double Elimination Bracket (Winners Bracket + Losers Bracket + Grand Final)
 */
export function generateDoubleEliminationBracket(
  tournamentId: string,
  participants: Array<BracketParticipant & { seed: number }>,
  baseStartDateIso: string
): GeneratedMatchNode[] {
  const winnersMatches = generateSingleEliminationBracket(
    tournamentId,
    participants,
    baseStartDateIso
  );
  const bracketSize = nextPowerOfTwo(participants.length);
  const totalWinnersRounds = Math.log2(bracketSize);
  const startMs = new Date(baseStartDateIso).getTime() || Date.now();

  const losersMatches: GeneratedMatchNode[] = [];
  const numLosersRounds = Math.max(1, (totalWinnersRounds - 1) * 2);

  for (let lr = 1; lr <= numLosersRounds; lr++) {
    const matchesInRound = Math.max(1, Math.floor(bracketSize / Math.pow(2, Math.floor((lr + 1) / 2) + 1)));
    for (let m = 1; m <= matchesInRound; m++) {
      losersMatches.push({
        id: `${tournamentId}-de-lr${lr}-m${m}`,
        roundNumber: lr,
        roundLabel: getKnockoutRoundLabel(lr, numLosersRounds, "LOSERS"),
        matchNumber: m,
        bracketSide: "LOSERS",
        playerOneId: null,
        playerTwoId: null,
        playerOneScore: null,
        playerTwoScore: null,
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: null,
        status: "SCHEDULED",
        scheduledAt: new Date(startMs + lr * 3600 * 1000 * 2).toISOString(),
      });
    }
  }

  const grandFinal: GeneratedMatchNode = {
    id: `${tournamentId}-de-gf-m1`,
    roundNumber: totalWinnersRounds + 1,
    roundLabel: "Grand Final",
    matchNumber: 1,
    bracketSide: "GRAND_FINAL",
    playerOneId: null,
    playerTwoId: null,
    playerOneScore: null,
    playerTwoScore: null,
    winnerId: null,
    nextMatchId: null,
    nextMatchSlot: null,
    status: "SCHEDULED",
    scheduledAt: new Date(startMs + (totalWinnersRounds + 2) * 3600 * 1000 * 2).toISOString(),
  };

  // Link Winners Final to Grand Final Slot 1
  const winnersFinal = winnersMatches[winnersMatches.length - 1];
  if (winnersFinal) {
    winnersFinal.nextMatchId = grandFinal.id;
    winnersFinal.nextMatchSlot = 1;
  }

  // Link Losers Final to Grand Final Slot 2
  const losersFinal = losersMatches[losersMatches.length - 1];
  if (losersFinal) {
    losersFinal.nextMatchId = grandFinal.id;
    losersFinal.nextMatchSlot = 2;
  }

  return [...winnersMatches, ...losersMatches, grandFinal];
}

/**
 * Generate Round Robin or League Season fixtures using the Circle Method (Berger tables).
 * Supports both even and odd participant counts cleanly.
 */
export function generateRoundRobinFixtures(
  tournamentId: string,
  participants: Array<BracketParticipant & { seed: number }>,
  baseStartDateIso: string,
  options?: {
    bracketSide?: "GROUP" | "LEAGUE";
    groupId?: string | null;
    groupName?: string | null;
    idPrefix?: string;
  }
): GeneratedMatchNode[] {
  if (participants.length < 2) {
    throw new Error("At least 2 participants are required for Round Robin fixtures.");
  }

  const list: Array<(BracketParticipant & { seed: number }) | null> = [...participants];
  if (list.length % 2 !== 0) {
    list.push(null); // Dummy slot for odd number of players (bye in that matchday)
  }

  const n = list.length;
  const numRounds = n - 1;
  const half = n / 2;
  const matches: GeneratedMatchNode[] = [];
  const startMs = new Date(baseStartDateIso).getTime() || Date.now();
  const prefix = options?.idPrefix ?? `${tournamentId}-rr`;
  const side = options?.bracketSide ?? "LEAGUE";

  let matchCounter = 1;
  const rotation = [...list];

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = rotation[i];
      const p2 = rotation[n - 1 - i];
      if (p1 && p2) {
        const home = round % 2 === 1 ? p1 : p2;
        const away = round % 2 === 1 ? p2 : p1;
        matches.push({
          id: `${prefix}-r${round}-m${matchCounter}`,
          roundNumber: round,
          roundLabel: options?.groupName
            ? `${options.groupName} — Matchday ${round}`
            : `Matchday ${round}`,
          matchNumber: matchCounter,
          bracketSide: side,
          groupId: options?.groupId ?? null,
          groupName: options?.groupName ?? null,
          playerOneId: home.userId,
          playerTwoId: away.userId,
          playerOneScore: null,
          playerTwoScore: null,
          winnerId: null,
          nextMatchId: null,
          nextMatchSlot: null,
          status: "READY",
          scheduledAt: new Date(startMs + (round - 1) * 3600 * 1000 * 3).toISOString(),
        });
        matchCounter++;
      }
    }

    // Rotate all elements except index 0
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  return matches;
}

/**
 * Generate full tournament structure for any of the 5 supported formats.
 */
export function generateTournamentFixturesAndBrackets(
  tournamentId: string,
  format: TournamentFormatId,
  rawParticipants: BracketParticipant[],
  seedingMode: "SEEDED" | "RANDOM",
  baseStartDateIso: string
): GeneratedTournamentStructure {
  const seeded = seedParticipants(rawParticipants, seedingMode);

  if (format === "SINGLE_ELIMINATION") {
    return {
      format,
      seededParticipants: seeded,
      groups: [],
      matches: generateSingleEliminationBracket(tournamentId, seeded, baseStartDateIso),
    };
  }

  if (format === "DOUBLE_ELIMINATION") {
    return {
      format,
      seededParticipants: seeded,
      groups: [],
      matches: generateDoubleEliminationBracket(tournamentId, seeded, baseStartDateIso),
    };
  }

  if (format === "ROUND_ROBIN" || format === "LEAGUE_SEASON") {
    return {
      format,
      seededParticipants: seeded,
      groups: [],
      matches: generateRoundRobinFixtures(tournamentId, seeded, baseStartDateIso, {
        bracketSide: "LEAGUE",
      }),
    };
  }

  // GROUP_PLUS_KNOCKOUT
  const numGroups = seeded.length >= 8 ? Math.min(4, Math.floor(seeded.length / 3)) : 2;
  const groups: GeneratedGroup[] = [];
  const groupBuckets: Array<Array<BracketParticipant & { seed: number }>> = [];

  for (let g = 0; g < numGroups; g++) {
    const groupLetter = String.fromCharCode(65 + g);
    groups.push({
      id: `${tournamentId}-group-${groupLetter.toLowerCase()}`,
      name: `Group ${groupLetter}`,
      orderIndex: g + 1,
      participantIds: [],
    });
    groupBuckets.push([]);
  }

  // Snake seeding into groups
  seeded.forEach((p, idx) => {
    const cycle = Math.floor(idx / numGroups);
    const groupIdx = cycle % 2 === 0 ? idx % numGroups : numGroups - 1 - (idx % numGroups);
    groups[groupIdx].participantIds.push(p.userId);
    groupBuckets[groupIdx].push(p);
  });

  const allMatches: GeneratedMatchNode[] = [];
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    const grpMatches = generateRoundRobinFixtures(
      tournamentId,
      groupBuckets[g],
      baseStartDateIso,
      {
        bracketSide: "GROUP",
        groupId: grp.id,
        groupName: grp.name,
        idPrefix: `${tournamentId}-grp-${g + 1}`,
      }
    );
    allMatches.push(...grpMatches);
  }

  // Add Knockout Stage placeholders for top qualifiers
  const knockoutSlots = nextPowerOfTwo(numGroups * 2);
  const knockoutRounds = Math.log2(knockoutSlots);
  const knockoutStartMs =
    (new Date(baseStartDateIso).getTime() || Date.now()) + 4 * 3600 * 1000 * 3;

  const koByRound: GeneratedMatchNode[][] = [];
  for (let r = 1; r <= knockoutRounds; r++) {
    const count = knockoutSlots / Math.pow(2, r);
    const roundLabel = getKnockoutRoundLabel(r, knockoutRounds, "WINNERS");
    const rMatches: GeneratedMatchNode[] = [];
    for (let m = 1; m <= count; m++) {
      rMatches.push({
        id: `${tournamentId}-ko-r${r}-m${m}`,
        roundNumber: 10 + r,
        roundLabel,
        matchNumber: m,
        bracketSide: "WINNERS",
        playerOneId: null,
        playerTwoId: null,
        playerOneScore: null,
        playerTwoScore: null,
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: null,
        status: "SCHEDULED",
        scheduledAt: new Date(knockoutStartMs + r * 3600 * 1000 * 2).toISOString(),
      });
    }
    koByRound.push(rMatches);
  }

  for (let r = 0; r < knockoutRounds - 1; r++) {
    const curr = koByRound[r];
    const next = koByRound[r + 1];
    for (let i = 0; i < curr.length; i++) {
      const target = next[Math.floor(i / 2)];
      curr[i].nextMatchId = target.id;
      curr[i].nextMatchSlot = i % 2 === 0 ? 1 : 2;
    }
  }

  allMatches.push(...koByRound.flat());

  return {
    format,
    seededParticipants: seeded,
    groups,
    matches: allMatches,
  };
}

export interface StandingsRow {
  userId: string;
  username: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/**
 * Calculate verified standings for Round Robin, League, or Group stages.
 * Only COMPLETED or WALKOVER verified matches are counted.
 * Tie-breakers: 1. Points, 2. Goal Difference, 3. Goals For, 4. Username.
 */
export function calculateStandings(
  participants: Array<{ userId: string; username: string }>,
  matches: Array<{
    playerOneId: string | null;
    playerTwoId: string | null;
    playerOneScore: number | null;
    playerTwoScore: number | null;
    status: string;
  }>
): StandingsRow[] {
  const map = new Map<string, StandingsRow>();
  for (const p of participants) {
    map.set(p.userId, {
      userId: p.userId,
      username: p.username,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (
      (m.status !== "COMPLETED" && m.status !== "WALKOVER") ||
      !m.playerOneId ||
      !m.playerTwoId ||
      m.playerOneScore === null ||
      m.playerTwoScore === null
    ) {
      continue;
    }

    const row1 = map.get(m.playerOneId);
    const row2 = map.get(m.playerTwoId);
    if (!row1 || !row2) continue;

    row1.played += 1;
    row2.played += 1;
    row1.goalsFor += m.playerOneScore;
    row1.goalsAgainst += m.playerTwoScore;
    row2.goalsFor += m.playerTwoScore;
    row2.goalsAgainst += m.playerOneScore;

    if (m.playerOneScore > m.playerTwoScore) {
      row1.wins += 1;
      row1.points += 3;
      row2.losses += 1;
    } else if (m.playerTwoScore > m.playerOneScore) {
      row2.wins += 1;
      row2.points += 3;
      row1.losses += 1;
    } else {
      row1.draws += 1;
      row2.draws += 1;
      row1.points += 1;
      row2.points += 1;
    }

    row1.goalDifference = row1.goalsFor - row1.goalsAgainst;
    row2.goalDifference = row2.goalsFor - row2.goalsAgainst;
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.username.localeCompare(b.username);
  });
}

/**
 * Validate whether a match can advance its winner in a knockout bracket.
 * Section 10 requirement: "Ensure the bracket engine cannot advance disputed or unverified results."
 */
export function canAdvanceBracketMatch(match: {
  status: string;
  winnerId: string | null;
  playerOneScore: number | null;
  playerTwoScore: number | null;
  verifiedAt?: string | null;
}): { allowed: boolean; reason?: string } {
  if (match.status === "DISPUTED") {
    return { allowed: false, reason: "Disputed matches cannot advance in the bracket." };
  }
  if (match.status !== "COMPLETED" && match.status !== "WALKOVER") {
    return { allowed: false, reason: "Only verified COMPLETED or WALKOVER matches may advance." };
  }
  if (!match.winnerId) {
    return { allowed: false, reason: "A verified winnerId is required to advance." };
  }
  if (
    match.playerOneScore !== null &&
    match.playerTwoScore !== null &&
    match.playerOneScore === match.playerTwoScore
  ) {
    return {
      allowed: false,
      reason: "Knockout matches cannot end in a draw; extra time or penalties score required.",
    };
  }
  return { allowed: true };
}
