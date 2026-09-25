import { queryOptions } from "@tanstack/react-query";
import {
  fetchBatch,
  fetchByGenre,
  fetchDetail,
  fetchDirectory,
  fetchGenres,
  fetchHome,
  fetchLatest,
  fetchPopular,
  fetchSchedule,
  fetchSearch,
  fetchStream,
} from "./anime.functions";
import type { AnimeSummary } from "./anime-types";

const common = {
  staleTime: 15 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
  retry: 1,
  refetchOnWindowFocus: false,
};

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function currentDayName(): string {
  try {
    const day = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
    }).format(new Date());
    return day.charAt(0).toUpperCase() + day.slice(1);
  } catch {
    return DAY_NAMES[new Date().getDay()] ?? "Senin";
  }
}

export const homeQuery = (specificDay?: string, provider = "otakudesu") => {
  const day = specificDay ?? currentDayName();
  return queryOptions({
    queryKey: ["home", day, provider],
    queryFn: () => fetchHome({ data: { day, provider } }),
    ...common,
  });
};

export const latestQuery = (page: number, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["latest", page, provider],
    queryFn: () => fetchLatest({ data: { page: Math.max(1, page), provider } }),
    ...common,
  });

export const popularQuery = (page: number, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["popular", page, provider],
    queryFn: () => fetchPopular({ data: { page: Math.max(1, page), provider } }),
    ...common,
  });

export const ongoingQuery = (page: number, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["ongoing", page, provider],
    queryFn: () => fetchLatest({ data: { page: Math.max(1, page), provider } }),
    ...common,
  });

export const completedQuery = (page: number, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["completed", page, provider],
    queryFn: () => fetchPopular({ data: { page: Math.max(1, page), provider } }),
    ...common,
  });

export const searchQuery = (term: string, page = 1, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["search", term.trim(), page, provider],
    queryFn: () =>
      fetchSearch({
        data: { keyword: term.trim(), page: Math.max(1, page), provider },
      }),
    enabled: term.trim().length > 0,
    ...common,
  });

export const genreListQuery = (provider = "otakudesu") =>
  queryOptions({
    queryKey: ["genres", provider],
    queryFn: () => fetchGenres({ data: { provider } }),
    ...common,
  });

export const genreAnimeQuery = (genreId: string, page: number, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["genre", genreId, page, provider],
    queryFn: () =>
      fetchByGenre({
        data: { genreId, page: Math.max(1, page), provider },
      }),
    ...common,
  });

export const scheduleQuery = (provider = "otakudesu") =>
  queryOptions({
    queryKey: ["schedule", provider],
    queryFn: () => fetchSchedule({ data: { provider } }),
    ...common,
  });

export const directoryQuery = (provider = "otakudesu") =>
  queryOptions({
    queryKey: ["directory", provider],
    queryFn: () => fetchDirectory({ data: { provider } }),
    ...common,
  });

export const animeDetailQuery = (animeId: string, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["anime", animeId, provider],
    queryFn: () => fetchDetail({ data: { id: animeId, provider } }),
    enabled: Boolean(animeId),
    ...common,
  });

export const batchQuery = (batchId: string, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["batch", batchId, provider],
    queryFn: () => fetchBatch({ data: { batchId, provider } }),
    enabled: Boolean(batchId),
    ...common,
  });

export const streamQuery = (episodeId: string, provider = "otakudesu") =>
  queryOptions({
    queryKey: ["stream", episodeId, provider],
    queryFn: () => fetchStream({ data: { episodeId, provider } }),
    enabled: Boolean(episodeId),
    staleTime: 60 * 1000,
    retry: 1,
  });

export type { AnimeSummary };
