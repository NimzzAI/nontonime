const STORAGE_KEY = "nonton-watchlist-v1";

export type WatchlistStatus = "watching" | "plan" | "completed";

export interface WatchlistItem {
  animeId: string;
  title: string;
  poster: string;
  addedAt: number;
  status?: WatchlistStatus;
  userRating?: number;
  notes?: string;
}

let cachedWatchlist: WatchlistItem[] | null = null;
let cachedIdSet: Set<string> | null = null;

function invalidateCache() {
  cachedWatchlist = null;
  cachedIdSet = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) invalidateCache();
  });
}

export function readWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  if (cachedWatchlist) return cachedWatchlist;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedWatchlist = [];
      cachedIdSet = new Set();
      return [];
    }
    const parsed = JSON.parse(raw) as WatchlistItem[];
    const items = Array.isArray(parsed)
      ? parsed
          .map((item) => ({
            ...item,
            status: item.status || "plan",
          }))
          .sort((a, b) => b.addedAt - a.addedAt)
      : [];
    cachedWatchlist = items;
    cachedIdSet = new Set(items.map((i) => i.animeId));
    return items;
  } catch {
    cachedWatchlist = [];
    cachedIdSet = new Set();
    return [];
  }
}

function write(items: WatchlistItem[]) {
  cachedWatchlist = items;
  cachedIdSet = new Set(items.map((i) => i.animeId));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("watchlist-updated"));
}

export function isInWatchlist(animeId: string): boolean {
  if (!cachedIdSet) {
    readWatchlist();
  }
  return cachedIdSet?.has(animeId) ?? false;
}

export function getWatchlistItem(animeId: string): WatchlistItem | undefined {
  return readWatchlist().find((item) => item.animeId === animeId);
}

export function addToWatchlist(
  animeId: string,
  title: string,
  poster: string,
  status: WatchlistStatus = "plan",
) {
  if (typeof window === "undefined") return;
  const existing = readWatchlist().filter((entry) => entry.animeId !== animeId);
  write([{ animeId, title, poster, addedAt: Date.now(), status }, ...existing]);
}

export function removeFromWatchlist(animeId: string) {
  write(readWatchlist().filter((entry) => entry.animeId !== animeId));
}

export function updateWatchlistItem(
  animeId: string,
  updates: Partial<Omit<WatchlistItem, "animeId">>,
) {
  const items = readWatchlist();
  const index = items.findIndex((i) => i.animeId === animeId);
  if (index === -1) return;
  items[index] = { ...items[index], ...updates };
  write(items);
}

export function toggleWatchlist(animeId: string, title: string, poster: string) {
  if (isInWatchlist(animeId)) {
    removeFromWatchlist(animeId);
    return false;
  }
  addToWatchlist(animeId, title, poster);
  return true;
}

export function exportWatchlist(): string {
  const items = readWatchlist();
  return JSON.stringify(
    {
      app: "nontonime",
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
    },
    null,
    2,
  );
}

export function importWatchlist(jsonString: string): { count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const candidateItems: WatchlistItem[] = Array.isArray(data)
      ? data
      : Array.isArray(data.items)
        ? data.items
        : [];

    if (candidateItems.length === 0) {
      return { count: 0, error: "Format berkas tidak valid atau tidak berisi anime." };
    }

    const current = readWatchlist();
    const map = new Map<string, WatchlistItem>();

    // Put current items
    for (const item of current) {
      map.set(item.animeId, item);
    }
    // Merge candidate items
    let addedCount = 0;
    for (const item of candidateItems) {
      if (item.animeId && item.title) {
        map.set(item.animeId, {
          animeId: item.animeId,
          title: item.title,
          poster: item.poster || "",
          addedAt: item.addedAt || Date.now(),
          status: item.status || "plan",
          userRating: item.userRating,
          notes: item.notes,
        });
        addedCount++;
      }
    }

    const merged = Array.from(map.values()).sort((a, b) => b.addedAt - a.addedAt);
    write(merged);
    return { count: addedCount };
  } catch {
    return { count: 0, error: "Gagal membaca berkas JSON. Pastikan format valid." };
  }
}
