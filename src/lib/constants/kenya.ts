// ============================================================================
// eFootball Kenya — Constants, 47 Counties, Platforms, Formats & Achievements
// ============================================================================

export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

export type KenyaCounty = (typeof KENYA_COUNTIES)[number];

export const KENYA_UNIVERSITIES = [
  "University of Nairobi (UoN)",
  "Kenyatta University (KU)",
  "Jomo Kenyatta University of Agriculture & Technology (JKUAT)",
  "Strathmore University",
  "Moi University",
  "Egerton University",
  "United States International University Africa (USIU-Africa)",
  "Technical University of Kenya (TUK)",
  "Mount Kenya University (MKU)",
  "Multimedia University of Kenya (MMU)",
  "Dedan Kimathi University of Technology (DeKUT)",
  "Maseno University",
] as const;

export const PLATFORMS = [
  { id: "MOBILE", label: "Mobile (Android / iOS)", short: "Mobile" },
  { id: "PLAYSTATION", label: "PlayStation (PS4 / PS5)", short: "PlayStation" },
  { id: "PC", label: "PC (Steam / Windows)", short: "PC" },
  { id: "XBOX", label: "Xbox (Series X|S / One)", short: "Xbox" },
  { id: "CROSS_PLATFORM", label: "Cross-Platform", short: "Cross-Play" },
] as const;

export type PlatformId = "MOBILE" | "PLAYSTATION" | "PC" | "XBOX" | "CROSS_PLATFORM";

export const TOURNAMENT_FORMATS = [
  {
    id: "SINGLE_ELIMINATION",
    label: "Single Elimination",
    description: "Knockout bracket where a single loss eliminates a player.",
  },
  {
    id: "DOUBLE_ELIMINATION",
    label: "Double Elimination",
    description: "Winners and Losers brackets; players must lose twice to be eliminated.",
  },
  {
    id: "ROUND_ROBIN",
    label: "Round Robin",
    description: "Every participant plays against every other participant in the pool.",
  },
  {
    id: "GROUP_PLUS_KNOCKOUT",
    label: "Group Stage + Knockout",
    description: "Round-robin group stage followed by single-elimination knockout rounds.",
  },
  {
    id: "LEAGUE_SEASON",
    label: "League Season",
    description: "Full points table division season with goal difference tie-breakers.",
  },
] as const;

export type TournamentFormatId =
  | "SINGLE_ELIMINATION"
  | "DOUBLE_ELIMINATION"
  | "ROUND_ROBIN"
  | "GROUP_PLUS_KNOCKOUT"
  | "LEAGUE_SEASON";

export const TOURNAMENT_CATEGORIES = [
  { id: "DAILY_QUICK_CUP", label: "Daily Quick Cups" },
  { id: "WEEKEND_CUP", label: "Weekend Cups" },
  { id: "MONTHLY_KENYA_OPEN", label: "Monthly Kenya Open" },
  { id: "COUNTY_CHAMPIONSHIP", label: "County Championships" },
  { id: "UNIVERSITY_COMPETITION", label: "University Competitions" },
  { id: "CLAN_CHAMPIONSHIP", label: "Clan Championships" },
  { id: "SPONSORED_EVENT", label: "Sponsored Events" },
  { id: "PRIVATE_TOURNAMENT", label: "Private Tournaments" },
] as const;

export const ACHIEVEMENT_DEFINITIONS = [
  {
    code: "FIRST_WIN",
    title: "First Victory",
    description: "Claimed your first verified competitive match win on eFootball Kenya.",
    tier: "BLUE",
  },
  {
    code: "FIVE_WINS",
    title: "Five Wins Milestone",
    description: "Won 5 verified competitive matches across official tournaments.",
    tier: "BLUE",
  },
  {
    code: "TEN_WINS",
    title: "Ten Wins Veteran",
    description: "Reached 10 verified competitive wins.",
    tier: "SILVER",
  },
  {
    code: "UNBEATEN_STREAK",
    title: "Unbeaten Streak (5+)",
    description: "Achieved a 5-match consecutive winning streak in verified competition.",
    tier: "YELLOW",
  },
  {
    code: "TOURNAMENT_CHAMPION",
    title: "Tournament Champion",
    description: "Won first place in an official eFootball Kenya tournament.",
    tier: "GOLD",
  },
  {
    code: "COUNTY_CHAMPION",
    title: "County Champion",
    description: "Ranked #1 in your home county or won a County Championship.",
    tier: "GOLD",
  },
  {
    code: "NATIONAL_CHALLENGER",
    title: "National Challenger",
    description: "Surpassed 1350 Elo rating in the National Leaderboard.",
    tier: "YELLOW",
  },
  {
    code: "CLAN_CHAMPION",
    title: "Clan Champion",
    description: "Represented a winning clan in an official Clan Championship.",
    tier: "GOLD",
  },
  {
    code: "SEASON_TOP_TEN",
    title: "Season Top Ten",
    description: "Entered the top 10 of the National Elo Leaderboard with verified matches.",
    tier: "GOLD",
  },
] as const;

export const MARKETPLACE_PERMITTED_CATEGORIES = [
  {
    slug: "gaming-coaching",
    name: "Gaming Coaching",
    description: "1-on-1 tactical analysis, formation setup, and competitive eFootball coaching.",
  },
  {
    slug: "training-sessions",
    name: "Training Sessions",
    description: "Structured sparring sessions, set-piece drills, and defensive shape clinics.",
  },
  {
    slug: "gaming-accessories",
    name: "Gaming Accessories",
    description: "Controllers, mobile cooling fans, thumb sleeves, headsets, and cables.",
  },
  {
    slug: "merchandise",
    name: "Esports Merchandise",
    description: "Clan jerseys, eFootball Kenya community apparel, hoodies, and desk mats.",
  },
  {
    slug: "approved-gaming-services",
    name: "Approved Gaming Services",
    description: "Stream overlays, tournament graphic design, controller repair, and LAN setup.",
  },
] as const;

export const PROHIBITED_MARKETPLACE_KEYWORDS = [
  "account for sale",
  "sell account",
  "konami id login",
  "account transfer",
  "coins hack",
  "credential handover",
  "shared password",
  "buy my account",
];
