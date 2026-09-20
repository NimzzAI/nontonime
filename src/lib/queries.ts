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

const common = { staleTime: 5 * 60 * 1000, retry: 1 };

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function currentDayName() {
  return DAY_NAMES[new Date().getDay()] ?? "Senin";
}

export const homeQuery = () => {
  const day = currentDayName();
  return queryOptions({
    queryKey: ["home", day],
    queryFn: () => fetchHome({ data: { day } }),
    ...common,
  });
};

export const latestQuery = (page: number) =>
  queryOptions({
    queryKey: ["latest", page],
    queryFn: () => fetchLatest({ data: { page: Math.max(1, page) } }),
    ...common,
  });

export const popularQuery = (page: number) =>
  queryOptions({
    queryKey: ["popular", page],
    queryFn: () => fetchPopular({ data: { page: Math.max(1, page) } }),
    ...common,
  });

export const ongoingQuery = (page: number) =>
  queryOptions({
    queryKey: ["ongoing", page],
    queryFn: () => fetchLatest({ data: { page: Math.max(1, page) } }),
    ...common,
  });

export const completedQuery = (page: number) =>
  queryOptions({
    queryKey: ["completed", page],
    queryFn: () => fetchPopular({ data: { page: Math.max(1, page) } }),
    ...common,
  });

export const searchQuery = (term: string, page = 1) =>
  queryOptions({
    queryKey: ["search", term.trim(), page],
    queryFn: () =>
      fetchSearch({
        data: { keyword: term.trim(), page: Math.max(1, page) },
      }),
    enabled: term.trim().length > 0,
    ...common,
  });

export const genreListQuery = () =>
  queryOptions({ queryKey: ["genres"], queryFn: () => fetchGenres(), ...common });

export const genreAnimeQuery = (genreId: string, page: number) =>
  queryOptions({
    queryKey: ["genre", genreId, page],
    queryFn: () =>
      fetchByGenre({
        data: { genreId, page: Math.max(1, page) },
      }),
    ...common,
  });

export const scheduleQuery = () =>
  queryOptions({ queryKey: ["schedule"], queryFn: () => fetchSchedule(), ...common });

export const directoryQuery = () =>
  queryOptions({ queryKey: ["directory"], queryFn: () => fetchDirectory(), ...common });

export const animeDetailQuery = (animeId: string) =>
  queryOptions({
    queryKey: ["anime", animeId],
    queryFn: () => fetchDetail({ data: { id: animeId } }),
    enabled: Boolean(animeId),
    ...common,
  });

export const batchQuery = (batchId: string) =>
  queryOptions({
    queryKey: ["batch", batchId],
    queryFn: () => fetchBatch({ data: { batchId } }),
    enabled: Boolean(batchId),
    ...common,
  });

export const streamQuery = (episodeId: string) =>
  queryOptions({
    queryKey: ["stream", episodeId],
    queryFn: () => fetchStream({ data: { episodeId } }),
    enabled: Boolean(episodeId),
    staleTime: 60 * 1000,
    retry: 1,
  });

export type { AnimeSummary };
