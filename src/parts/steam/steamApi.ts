import { API_URL } from "../../Utils";

export type SteamProfile = {
  name: string;
  avatar: string;
  profileUrl: string;
  status: number;
  currentGame: string | null;
  memberSince: number | null;
  country: string | null;
  level: number | null;
};

export type SteamGame = {
  appid: number;
  name: string;
  minutes: number;
  minutes2Weeks: number;
  lastPlayed: number | null;
  icon: string | null;
  hasStats: boolean;
};

export type SteamOverview = {
  profile: SteamProfile;
  stats: { gameCount: number; recentCount: number; totalMinutes: number };
  games: SteamGame[];
};

export type Achievement = {
  id: string;
  name: string;
  description: string | null;
  hidden: boolean;
  achieved: boolean;
  unlockTime: number | null;
  icon: string;
  percent: number | null;
};

export type AchievementSummary = {
  achievementsPrivate: boolean;
  totalUnlocked: number;
  totalAvailable: number;
  perfectGames: number;
  gamesWithAchievements: number;
  perGame: Record<string, { unlocked: number; total: number }>;
  latestUnlocks: (Achievement & { appid: number; game: string })[];
};

export type GameAchievements = {
  appid: number;
  name: string;
  unlocked: number;
  total: number;
  achievements: Achievement[];
};

const responses = new Map<string, Promise<unknown>>();

// Results are kept for the session, failures are retried on the next call.
function getJson<T>(path: string): Promise<T> {
  const hit = responses.get(path);
  if (hit) return hit as Promise<T>;
  const promise = fetch(`${API_URL}${path}`).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  });
  responses.set(path, promise);
  promise.catch(() => responses.delete(path));
  return promise;
}

export const fetchOverview = () => getJson<SteamOverview>("/steam/overview");

export const fetchAchievementSummary = (lang: string) =>
  getJson<AchievementSummary>(`/steam/achievements/summary?lang=${lang}`);

export const fetchGameAchievements = (appid: number, lang: string) =>
  getJson<GameAchievements>(`/steam/achievements/${appid}?lang=${lang}`);

export const headerImage = (appid: number) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

export const storePage = (appid: number) =>
  `https://store.steampowered.com/app/${appid}/`;
