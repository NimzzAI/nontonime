/**
 * Local Storage utility & custom hook for persisting and managing recent anime search queries.
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nontonime_recent_searches";
const MAX_RECENT_SEARCHES = 12;
const RECENT_SEARCHES_EVENT = "nontonime_recent_searches_updated";

/**
 * Retrieves the stored recent search terms from localStorage safely.
 */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );
    }
  } catch {
    // If corrupt, silently ignore
  }
  return [];
}

/**
 * Adds a new search query to the beginning of the recent searches list.
 * Deduplicates existing terms and caps to MAX_RECENT_SEARCHES.
 */
export function addRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const clean = (query || "").trim();
  if (!clean || clean.length < 2) return;

  try {
    const current = getRecentSearches();
    const filtered = current.filter((item) => item.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: updated }));
  } catch (err) {
    console.warn("Failed to persist recent search query to localStorage:", err);
  }
}

/**
 * Removes a specific search query from localStorage.
 */
export function removeRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const target = (query || "").trim().toLowerCase();
  if (!target) return;

  try {
    const current = getRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== target);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: updated }));
  } catch (err) {
    console.warn("Failed to remove recent search item from localStorage:", err);
  }
}

/**
 * Clears all recent searches from localStorage.
 */
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: [] }));
  } catch (err) {
    console.warn("Failed to clear recent searches from localStorage:", err);
  }
}

/**
 * React hook that exposes reactive recent search queries and mutation actions.
 */
export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setSearches(getRecentSearches());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setSearches(custom.detail);
      } else {
        setSearches(getRecentSearches());
      }
    };

    window.addEventListener(RECENT_SEARCHES_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(RECENT_SEARCHES_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const add = useCallback((q: string) => addRecentSearch(q), []);
  const remove = useCallback((q: string) => removeRecentSearch(q), []);
  const clear = useCallback(() => clearRecentSearches(), []);

  return {
    searches,
    addRecentSearch: add,
    removeRecentSearch: remove,
    clearRecentSearches: clear,
  };
}
