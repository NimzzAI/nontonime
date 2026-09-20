import { queryOptions } from "@tanstack/react-query";
import {
  fetchByGenre,
  fetchDetail,
  fetchGenres,
  fetchHome,
  fetchLatest,
  fetchPopular,
  fetchSchedule,
  fetchSearch,
  fetchStream,
} from "./anime.functions";
import type { AnimeSummary, ListResult } from "./anime-types";

const common = { staleTime: 5 * 60 * 1000, retry: 1 };

function filterByStatus(result: ListResult, pattern: RegExp): ListResult {
  const filtered = result.items.filter((item) => pattern.test(item.status ?? ""));
  return { ...result, items: filtered };
}

const DAY_NAMES = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

function currentDayName() {
  return DAY_NAMES[new Date().getDay()] ?? "KAMIS";
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
    queryFn: () => fetchLatest({ data: { page: page - 1 } }),
    ...common,
  });

export const popularQuery = (page: number) =>
  queryOptions({
    queryKey: ["popular", page],
    queryFn: () => fetchPopular({ data: { page: page - 1 } }),
    ...common,
  });

export const ongoingQuery = (page: number) =>
  queryOptions({
    queryKey: ["ongoing", page],
    queryFn: async () =>
      filterByStatus(await fetchLatest({ data: { page: page - 1 } }), /ongoing|tayang/i),
    ...common,
  });

export const completedQuery = (page: number) =>
  queryOptions({
    queryKey: ["completed", page],
    queryFn: async () =>
      filterByStatus(await fetchPopular({ data: { page: page - 1 } }), /tamat|complete|end/i),
    ...common,
  });

export const searchQuery = (term: string, page = 1) =>
  queryOptions({
    queryKey: ["search", term, page],
    queryFn: () => fetchSearch({ data: { keyword: term, page: page - 1 } }),
    enabled: term.trim().length > 0,
    ...common,
  });

export const genreListQuery = () =>
  queryOptions({ queryKey: ["genres"], queryFn: () => fetchGenres(), ...common });

export const genreAnimeQuery = (genreId: string, page: number) =>
  queryOptions({
    queryKey: ["genre", genreId, page],
    queryFn: () => fetchByGenre({ data: { genreId, page: page - 1 } }),
    ...common,
  });

export const scheduleQuery = () =>
  queryOptions({ queryKey: ["schedule"], queryFn: () => fetchSchedule(), ...common });

export const animeDetailQuery = (animeId: string) =>
  queryOptions({
    queryKey: ["anime", animeId],
    queryFn: () => fetchDetail({ data: { id: animeId } }),
    enabled: Boolean(animeId),
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
