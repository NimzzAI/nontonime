import { queryOptions } from "@tanstack/react-query";
import { fetchAnimeApi } from "./anime.functions";
import type {
  AnimeDetail,
  AnimeListData,
  ApiEnvelope,
  BatchDetail,
  EpisodeDetail,
  Genre,
  HomeData,
  ScheduleDay,
} from "./anime-types";

async function get<T>(path: string) {
  return (await fetchAnimeApi({ data: { path } })) as unknown as ApiEnvelope<T>;
}

const common = { staleTime: 5 * 60 * 1000, retry: 1 };

export const homeQuery = () =>
  queryOptions({ queryKey: ["home"], queryFn: () => get<HomeData>("/home"), ...common });

export const ongoingQuery = (page: number) =>
  queryOptions({
    queryKey: ["ongoing", page],
    queryFn: () => get<AnimeListData>(`/ongoing-anime?page=${page}`),
    ...common,
  });

export const completedQuery = (page: number) =>
  queryOptions({
    queryKey: ["completed", page],
    queryFn: () => get<AnimeListData>(`/complete-anime?page=${page}`),
    ...common,
  });

export const searchQuery = (term: string) =>
  queryOptions({
    queryKey: ["search", term],
    queryFn: () => get<AnimeListData>(`/search/${encodeURIComponent(term)}`),
    enabled: term.trim().length > 0,
    ...common,
  });

export const genreListQuery = () =>
  queryOptions({
    queryKey: ["genres"],
    queryFn: () => get<{ genreList: Genre[] }>("/genre"),
    ...common,
  });

export const genreAnimeQuery = (genreId: string, page: number) =>
  queryOptions({
    queryKey: ["genre", genreId, page],
    queryFn: () => get<AnimeListData>(`/genre/${genreId}?page=${page}`),
    ...common,
  });

export const scheduleQuery = () =>
  queryOptions({
    queryKey: ["schedule"],
    queryFn: () => get<ScheduleDay[]>("/schedule"),
    ...common,
  });

export const animeDetailQuery = (animeId: string) =>
  queryOptions({
    queryKey: ["anime", animeId],
    queryFn: () => get<AnimeDetail>(`/anime/${animeId}`),
    ...common,
  });

export const episodeQuery = (episodeId: string) =>
  queryOptions({
    queryKey: ["episode", episodeId],
    queryFn: () => get<EpisodeDetail>(`/episode/${episodeId}`),
    staleTime: 0,
    retry: 1,
  });

export const streamQuery = (serverId: string | null) =>
  queryOptions({
    queryKey: ["server", serverId],
    queryFn: () => get<{ url: string }>(`/server/${serverId}`),
    enabled: Boolean(serverId),
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });

export const batchQuery = (batchId: string) =>
  queryOptions({
    queryKey: ["batch", batchId],
    queryFn: () => get<BatchDetail>(`/batch/${batchId}`),
    ...common,
  });
