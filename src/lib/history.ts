const STORAGE_KEY = "nonton-history-v1";

export interface HistoryItem {
  episodeId: string;
  animeId: string;
  animeTitle: string;
  episodeTitle: string;
  poster: string;
  watchedAt: number;
  duration?: number;
  currentTime?: number;
  progressPercent?: number;
  episodeNumber?: number;
}

let cachedHistory: HistoryItem[] | null = null;

function invalidateCache() {
  cachedHistory = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) invalidateCache();
  });
}

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  if (cachedHistory) return cachedHistory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedHistory = [];
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryItem[];
    const items = Array.isArray(parsed) ? parsed.sort((a, b) => b.watchedAt - a.watchedAt) : [];
    cachedHistory = items;
    return items;
  } catch {
    cachedHistory = [];
    return [];
  }
}

function write(items: HistoryItem[]) {
  cachedHistory = items;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
  window.dispatchEvent(new Event("history-updated"));
}

export function saveHistory(item: HistoryItem) {
  if (typeof window === "undefined") return;
  const currentHistory = readHistory();
  const existing = currentHistory.find((entry) => entry.episodeId === item.episodeId);

  // Preserve existing progress if not explicitly passed
  const duration = item.duration ?? existing?.duration ?? 1440;
  const currentTime = item.currentTime ?? existing?.currentTime ?? 120;
  const progressPercent =
    item.progressPercent ??
    existing?.progressPercent ??
    Math.min(100, Math.max(5, Math.round((currentTime / duration) * 100)));

  const updatedItem: HistoryItem = {
    ...item,
    duration,
    currentTime,
    progressPercent,
    episodeNumber:
      item.episodeNumber ??
      existing?.episodeNumber ??
      parseInt(item.episodeTitle?.match(/\d+/)?.[0] || "1", 10),
  };

  const remaining = currentHistory.filter((entry) => entry.episodeId !== item.episodeId);
  write([updatedItem, ...remaining]);
}

export function updateHistoryProgress(episodeId: string, currentTime: number, duration?: number) {
  if (typeof window === "undefined" || !episodeId) return;
  const items = readHistory();
  const index = items.findIndex((entry) => entry.episodeId === episodeId);
  if (index === -1) return;

  const current = items[index];
  const dur = duration && duration > 0 ? duration : current.duration || 1440;
  const progressPercent = Math.min(100, Math.max(1, Math.round((currentTime / dur) * 100)));

  items[index] = {
    ...current,
    currentTime,
    duration: dur,
    progressPercent,
    watchedAt: Date.now(),
  };
  write([...items]);
}

export function removeHistory(episodeId: string) {
  write(readHistory().filter((entry) => entry.episodeId !== episodeId));
}

export function clearHistory() {
  write([]);
}
