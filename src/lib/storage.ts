const FAV_KEY = "quietfind-favorites-v1";
const LOG_KEY = "quietfind-logs-v1";
const CUSTOM_KEY = "quietfind-custom-v1";

export type QuietLog = {
  spotId: string;
  quiet: number;
  note: string;
  at: string;
};

export type CustomSpot = {
  id: string;
  name: string;
  type: string;
  area: string;
  lat: number;
  lng: number;
  quiet: number;
  wifi: boolean;
  plugs: boolean;
  hours: string;
  blurb: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadFavorites(): string[] {
  return readJson<string[]>(FAV_KEY, []);
}

export function saveFavorites(ids: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export function loadLogs(): QuietLog[] {
  return readJson<QuietLog[]>(LOG_KEY, []);
}

export function saveLogs(logs: QuietLog[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200)));
}

export function addQuietLog(log: QuietLog) {
  const next = [log, ...loadLogs().filter((l) => l.spotId !== log.spotId)];
  saveLogs(next);
  return next;
}

export function effectiveQuiet(spotId: string, base: number) {
  const log = loadLogs().find((l) => l.spotId === spotId);
  return log ? log.quiet : base;
}

export function loadCustomSpots(): CustomSpot[] {
  return readJson<CustomSpot[]>(CUSTOM_KEY, []);
}

export function saveCustomSpots(spots: CustomSpot[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(spots.slice(0, 40)));
}
