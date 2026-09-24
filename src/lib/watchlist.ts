const STORAGE_KEY = "nonton-watchlist-v1";
import { addExp } from "./gamification";
import { auth, db } from "./firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export type WatchlistStatus = "watching" | "plan" | "completed";

export interface WatchlistItem {
  animeId: string;
  title: string;
  poster: string;
  addedAt: number;
  status?: WatchlistStatus;
  currentEpisode?: number;
  totalEpisodes?: number;
  userRating?: number;
  notes?: string;
  updatedAt?: number;
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
            currentEpisode: item.currentEpisode ?? 1,
            totalEpisodes: item.totalEpisodes ?? 12,
          }))
          .sort((a, b) => (b.updatedAt || b.addedAt) - (a.updatedAt || a.addedAt))
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
  currentEpisode: number = 1,
  totalEpisodes: number = 12,
) {
  if (typeof window === "undefined") return;
  const existing = readWatchlist().filter((entry) => entry.animeId !== animeId);
  const newItem: WatchlistItem = {
    animeId,
    title,
    poster,
    addedAt: Date.now(),
    status,
    currentEpisode,
    totalEpisodes,
    updatedAt: Date.now(),
  };
  write([newItem, ...existing]);
  addExp(15, `Menambah "${title}" ke Watchlist`);

  // Sync to Firestore if authenticated
  if (auth.currentUser) {
    const itemRef = doc(db, "users", auth.currentUser.uid, "watchlist", animeId);
    setDoc(itemRef, newItem, { merge: true }).catch((e) =>
      console.warn("Firestore watchlist sync failed:", e),
    );
  }
}

export function removeFromWatchlist(animeId: string) {
  write(readWatchlist().filter((entry) => entry.animeId !== animeId));

  // Remove from Firestore if authenticated
  if (auth.currentUser) {
    const itemRef = doc(db, "users", auth.currentUser.uid, "watchlist", animeId);
    deleteDoc(itemRef).catch((e) => console.warn("Firestore watchlist delete failed:", e));
  }
}

export function updateWatchlistItem(
  animeId: string,
  updates: Partial<Omit<WatchlistItem, "animeId">>,
) {
  const items = readWatchlist();
  const index = items.findIndex((i) => i.animeId === animeId);
  if (index === -1) return;
  const updatedItem = { ...items[index], ...updates, updatedAt: Date.now() };
  items[index] = updatedItem;
  write(items);

  // Sync to Firestore if authenticated
  if (auth.currentUser) {
    const itemRef = doc(db, "users", auth.currentUser.uid, "watchlist", animeId);
    setDoc(itemRef, updatedItem, { merge: true }).catch((e) =>
      console.warn("Firestore updateWatchlistItem failed:", e),
    );
  }
}

export function updateEpisodeProgress(
  animeId: string,
  currentEpisode: number,
  totalEpisodes?: number,
) {
  const item = getWatchlistItem(animeId);
  if (!item) return;

  const validEpisode = Math.max(1, currentEpisode);
  const targetTotal = totalEpisodes ?? item.totalEpisodes ?? 12;
  const isCompleted = targetTotal > 0 && validEpisode >= targetTotal;
  const newStatus: WatchlistStatus = isCompleted ? "completed" : "watching";

  updateWatchlistItem(animeId, {
    currentEpisode: validEpisode,
    totalEpisodes: targetTotal,
    status: newStatus,
  });

  addExp(20, `Nonton Episode ${validEpisode} ${item.title}`);
}

export function updateWatchlistStatus(animeId: string, status: WatchlistStatus) {
  const item = getWatchlistItem(animeId);
  if (!item) return;

  updateWatchlistItem(animeId, { status });

  if (status === "completed") {
    addExp(50, `Menamatkan Anime ${item.title} 🎉`);
  } else if (status === "watching") {
    addExp(10, `Mulai Nonton ${item.title}`);
  }
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

    for (const item of current) {
      map.set(item.animeId, item);
    }

    let addedCount = 0;
    for (const item of candidateItems) {
      if (item.animeId && item.title) {
        const fullItem: WatchlistItem = {
          animeId: item.animeId,
          title: item.title,
          poster: item.poster || "",
          addedAt: item.addedAt || Date.now(),
          status: item.status || "plan",
          currentEpisode: item.currentEpisode ?? 1,
          totalEpisodes: item.totalEpisodes ?? 12,
          userRating: item.userRating,
          notes: item.notes,
          updatedAt: item.updatedAt || Date.now(),
        };
        map.set(item.animeId, fullItem);
        addedCount++;

        // Also sync each to Firestore if logged in
        if (auth.currentUser) {
          const itemRef = doc(db, "users", auth.currentUser.uid, "watchlist", item.animeId);
          setDoc(itemRef, fullItem, { merge: true }).catch(() => {});
        }
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => (b.updatedAt || b.addedAt) - (a.updatedAt || a.addedAt),
    );
    write(merged);
    return { count: addedCount };
  } catch {
    return { count: 0, error: "Gagal membaca berkas JSON. Pastikan format valid." };
  }
}
