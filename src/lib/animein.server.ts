import type {
  AnimeDetail,
  AnimeSummary,
  BatchDetail,
  DirectoryGroup,
  EpisodeSummary,
  GenreItem,
  HomeSections,
  ListResult,
  ScheduleMap,
  StreamResult,
} from "./anime-types";

export function getApiBase(): string {
  const env =
    process.env.SANKA_API_BASE ||
    process.env.SANKA_API_URL ||
    process.env.SANKA_API_IP ||
    process.env.ANIME_API_URL;
  if (env && env.trim()) {
    let clean = env.trim().replace(/\/+$/, "");
    if (!clean.endsWith("/anime")) {
      clean = `${clean}/anime`;
    }
    return clean;
  }
  return "https://www.sankavollerei.web.id/anime";
}

function getFallbackApiBase(): string | null {
  const fallback = process.env.SANKA_API_FALLBACK;
  if (fallback && fallback.trim()) {
    let clean = fallback.trim().replace(/\/+$/, "");
    if (!clean.endsWith("/anime")) {
      clean = `${clean}/anime`;
    }
    return clean;
  }
  return null;
}

function buildApiUrl(path: string, base = getApiBase()): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://www.sankavollerei.web.id/",
  Origin: "https://www.sankavollerei.web.id",
  "Sec-Ch-Ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

interface CacheEntry<T> {
  data: T;
  expires: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const lastSuccessfulResponse = new Map<string, unknown>();

async function fetchJson<T>(url: string, ttlMs = 15 * 60 * 1000): Promise<T> {
  // 1. Check valid memory cache
  const cached = cache.get(url);
  if (cached && Date.now() < cached.expires) {
    return cached.data as T;
  }

  // 2. Coalesce duplicate in-flight requests (prevents bursts of identical HTTP calls)
  const inFlight = inFlightRequests.get(url);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const fetchPromise = (async (): Promise<T> => {
    try {
      let res: Response;
      try {
        res = await fetch(url, {
          headers: BROWSER_HEADERS,
        });
      } catch (netErr) {
        // If fetch failed and fallback is available, attempt fallback
        const fallbackBase = getFallbackApiBase();
        if (fallbackBase && !url.startsWith(fallbackBase)) {
          const fallbackUrl = url.replace(getApiBase(), fallbackBase);
          console.warn(`[API] Network error on ${url}. Retrying with fallback: ${fallbackUrl}`);
          return await fetchJson<T>(fallbackUrl, ttlMs);
        }
        // If we have any last successful response, serve stale to save user experience
        const stale = lastSuccessfulResponse.get(url);
        if (stale) {
          console.warn(`[API] Network error on ${url}. Serving stale fallback response.`);
          return stale as T;
        }
        throw netErr;
      }

      if (res.status === 403) {
        const fallbackBase = getFallbackApiBase();
        if (fallbackBase && !url.startsWith(fallbackBase)) {
          const fallbackUrl = url.replace(getApiBase(), fallbackBase);
          console.warn(
            `[API] 403 Forbidden on ${url}. Retrying with fallback IP/Proxy: ${fallbackUrl}`,
          );
          return await fetchJson<T>(fallbackUrl, ttlMs);
        }
        // Fallback to stale if available
        const stale = lastSuccessfulResponse.get(url);
        if (stale) {
          console.warn(`[API] 403 Forbidden on ${url}. Serving stale fallback response.`);
          return stale as T;
        }
        console.error(
          `[Sanka API 403 Forbidden] Request ke ${url} ditolak oleh Cloudflare/WAF. ` +
            `Solusi: Atur SANKA_API_BASE=<URL/IP_PROXY> pada environment variable Vercel / server Anda.`,
        );
      }

      if (!res.ok) {
        const stale = lastSuccessfulResponse.get(url);
        if (stale) {
          console.warn(`[API] Fetch error ${res.status}. Serving stale response.`);
          return stale as T;
        }
        throw new Error(`API fetch error ${res.status}: ${res.statusText} at ${url}`);
      }

      const json = await res.json();
      cache.set(url, { data: json, expires: Date.now() + ttlMs });
      lastSuccessfulResponse.set(url, json);
      return json as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

interface ApiHomeResponse {
  status: string;
  data: {
    ongoing: {
      animeList: {
        title: string;
        poster: string;
        episodes?: number | string;
        releaseDay?: string;
        latestReleaseDate?: string;
        animeId: string;
      }[];
    };
    completed: {
      animeList: {
        title: string;
        poster: string;
        episodes?: number | string;
        score?: string;
        lastReleaseDate?: string;
        animeId: string;
      }[];
    };
  };
}

export async function getHome(dayFilter?: string | null): Promise<HomeSections> {
  try {
    const json = await fetchJson<ApiHomeResponse>(`${getApiBase()}/home`);
    const ongoingRaw = json.data?.ongoing?.animeList ?? [];
    const completedRaw = json.data?.completed?.animeList ?? [];

    const ongoing: AnimeSummary[] = ongoingRaw.map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      episodeCount:
        typeof a.episodes === "number" ? a.episodes : parseInt(String(a.episodes || 0), 10) || null,
      status: "Ongoing",
      type: "TV",
      releaseDay: a.releaseDay ?? null,
      day: a.releaseDay ?? null,
      latestReleaseDate: a.latestReleaseDate ?? null,
      genres: [],
    }));

    const completed: AnimeSummary[] = completedRaw.map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      episodeCount:
        typeof a.episodes === "number" ? a.episodes : parseInt(String(a.episodes || 0), 10) || null,
      score: a.score ?? null,
      status: "Completed",
      type: "TV",
      latestReleaseDate: a.lastReleaseDate ?? null,
      genres: [],
    }));

    const slider = ongoing.slice(0, 7);

    let today = ongoing;
    if (dayFilter) {
      today = ongoing.filter(
        (a) => a.releaseDay?.toLowerCase().trim() === dayFilter.toLowerCase().trim(),
      );
    }

    return {
      slider: slider.length > 0 ? slider : ongoing.slice(0, 5),
      today: today.length > 0 ? today : ongoing,
      hot: ongoing.slice(0, 10),
      popular: completed.slice(0, 10),
      new: ongoing.slice(0, 12),
      waiting: completed.slice(0, 8),
    };
  } catch (error) {
    console.error("Error in getHome:", error);
    throw error;
  }
}

interface ApiOngoingResponse {
  status: string;
  data: {
    animeList: {
      title: string;
      poster: string;
      episodes?: number;
      releaseDay?: string;
      latestReleaseDate?: string;
      animeId: string;
    }[];
  };
  pagination: {
    currentPage: number;
    hasPrevPage: boolean;
    prevPage: number | null;
    hasNextPage: boolean;
    nextPage: number | null;
    totalPages: number;
  } | null;
}

export async function getLatest(page = 1): Promise<ListResult> {
  const safePage = Math.max(1, page);
  try {
    const json = await fetchJson<ApiOngoingResponse>(
      `${getApiBase()}/ongoing-anime?page=${safePage}`,
    );
    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      episodeCount: a.episodes ?? null,
      status: "Ongoing",
      type: "TV",
      releaseDay: a.releaseDay ?? null,
      day: a.releaseDay ?? null,
      latestReleaseDate: a.latestReleaseDate ?? null,
      genres: [],
    }));

    return {
      items,
      page: safePage,
      hasNext: Boolean(json.pagination?.hasNextPage),
      totalPages: json.pagination?.totalPages ?? 1,
      pagination: json.pagination,
    };
  } catch (error) {
    console.error("Error in getLatest:", error);
    throw error;
  }
}

interface ApiCompletedResponse {
  status: string;
  data: {
    animeList: {
      title: string;
      poster: string;
      episodes?: number;
      score?: string;
      lastReleaseDate?: string;
      animeId: string;
    }[];
  };
  pagination: {
    currentPage: number;
    hasPrevPage: boolean;
    prevPage: number | null;
    hasNextPage: boolean;
    nextPage: number | null;
    totalPages: number;
  } | null;
}

export async function getPopular(page = 1): Promise<ListResult> {
  const safePage = Math.max(1, page);
  try {
    const json = await fetchJson<ApiCompletedResponse>(
      `${getApiBase()}/complete-anime?page=${safePage}`,
    );
    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      episodeCount: a.episodes ?? null,
      score: a.score ?? null,
      status: "Completed",
      type: "TV",
      latestReleaseDate: a.lastReleaseDate ?? null,
      genres: [],
    }));

    return {
      items,
      page: safePage,
      hasNext: Boolean(json.pagination?.hasNextPage),
      totalPages: json.pagination?.totalPages ?? 1,
      pagination: json.pagination,
    };
  } catch (error) {
    console.error("Error in getPopular:", error);
    throw error;
  }
}

interface ApiSearchResponse {
  status: string;
  data: {
    animeList: {
      title: string;
      poster: string;
      status?: string;
      score?: string;
      animeId: string;
      genreList?: { title: string; genreId: string }[];
    }[];
  };
}

export async function search(keyword: string, _page = 1): Promise<ListResult> {
  if (!keyword || !keyword.trim()) {
    return { items: [], page: 1, hasNext: false };
  }

  try {
    const json = await fetchJson<ApiSearchResponse>(
      `${getApiBase()}/search/${encodeURIComponent(keyword.trim())}`,
    );
    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      status: a.status ?? null,
      score: a.score ?? null,
      type: "TV",
      genres: (a.genreList ?? []).map((g) => g.title),
    }));

    return {
      items,
      page: 1,
      hasNext: false,
      totalPages: 1,
    };
  } catch (error) {
    console.error("Error in search:", error);
    throw error;
  }
}

interface ApiGenreResponse {
  status: string;
  data: {
    genreList: {
      title: string;
      genreId: string;
    }[];
  };
}

export async function getGenres(): Promise<GenreItem[]> {
  try {
    const json = await fetchJson<ApiGenreResponse>(`${getApiBase()}/genre`);
    return (json.data?.genreList ?? []).map((g) => ({
      id: g.genreId,
      name: g.title,
    }));
  } catch (error) {
    console.error("Error in getGenres:", error);
    throw error;
  }
}

interface ApiByGenreResponse {
  status: string;
  data: {
    animeList: {
      title: string;
      poster: string;
      studios?: string;
      score?: string;
      episodes?: number;
      season?: string;
      animeId: string;
      synopsis?: {
        paragraphs?: string[];
      };
      genreList?: { title: string; genreId: string }[];
    }[];
  };
  pagination: {
    currentPage: number;
    hasPrevPage: boolean;
    prevPage: number | null;
    hasNextPage: boolean;
    nextPage: number | null;
    totalPages: number;
  } | null;
}

export async function getByGenre(genreId: string, page = 1, _sort = "views"): Promise<ListResult> {
  const safePage = Math.max(1, page);
  try {
    const json = await fetchJson<ApiByGenreResponse>(
      `${getApiBase()}/genre/${encodeURIComponent(genreId)}?page=${safePage}`,
    );

    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      score: a.score ?? null,
      episodeCount: a.episodes ?? null,
      studios: a.studios ?? null,
      genres: (a.genreList ?? []).map((g) => g.title),
      synopsis: a.synopsis?.paragraphs?.join("\n\n") ?? null,
      type: "TV",
    }));

    return {
      items,
      page: safePage,
      hasNext: Boolean(json.pagination?.hasNextPage),
      totalPages: json.pagination?.totalPages ?? 1,
      pagination: json.pagination,
    };
  } catch (error) {
    console.error("Error in getByGenre:", error);
    throw error;
  }
}

interface ApiScheduleResponse {
  status: string;
  data: {
    day: string;
    anime_list: {
      title: string;
      slug: string;
      url: string;
      poster: string;
    }[];
  }[];
}

export async function getSchedule(): Promise<ScheduleMap> {
  try {
    const json = await fetchJson<ApiScheduleResponse>(`${getApiBase()}/schedule`);
    const map: ScheduleMap = {};

    for (const item of json.data ?? []) {
      const dayName = item.day;
      map[dayName] = (item.anime_list ?? []).map((a) => ({
        id: a.slug,
        title: a.title,
        poster: a.poster,
        releaseDay: dayName,
        day: dayName,
        status: "Ongoing",
        genres: [],
      }));
    }

    return map;
  } catch (error) {
    console.error("Error in getSchedule:", error);
    throw error;
  }
}

interface ApiUnlimitedResponse {
  status: string;
  data: {
    list: DirectoryGroup[];
  };
}

export async function getDirectory(): Promise<DirectoryGroup[]> {
  try {
    const json = await fetchJson<ApiUnlimitedResponse>(`${getApiBase()}/unlimited`);
    return json.data?.list ?? [];
  } catch (error) {
    console.error("Error in getDirectory:", error);
    return [];
  }
}

interface ApiDetailResponse {
  status: string;
  data: {
    title: string;
    poster: string;
    japanese?: string;
    score?: string;
    producers?: string;
    type?: string;
    status?: string;
    episodes?: number;
    duration?: string;
    aired?: string;
    studios?: string;
    batch?: {
      title: string;
      batchId: string;
      href?: string;
      otakudesuUrl?: string;
    } | null;
    synopsis?: {
      paragraphs?: string[];
    };
    genreList?: { title: string; genreId: string }[];
    episodeList?: {
      title: string;
      eps: number;
      date?: string;
      episodeId: string;
      href?: string;
    }[];
    recommendedAnimeList?: {
      title: string;
      poster: string;
      animeId: string;
    }[];
  };
}

export async function getDetail(id: string): Promise<AnimeDetail> {
  try {
    const json = await fetchJson<ApiDetailResponse>(
      `${getApiBase()}/anime/${encodeURIComponent(id)}`,
    );
    const d = json.data;

    const episodes: EpisodeSummary[] = (d.episodeList ?? []).map((ep) => ({
      id: ep.episodeId,
      number: ep.eps || 0,
      title: ep.title,
      releaseDate: ep.date ?? null,
    }));

    const recommended: AnimeSummary[] = (d.recommendedAnimeList ?? []).map((r) => ({
      id: r.animeId,
      title: r.title,
      poster: r.poster,
      genres: [],
    }));

    const synopsisText = d.synopsis?.paragraphs?.join("\n\n") || null;

    return {
      id,
      title: d.title,
      poster: d.poster,
      japanese: d.japanese ?? null,
      score: d.score ?? null,
      producers: d.producers ?? null,
      type: d.type ?? "TV",
      status: d.status ?? "Unknown",
      episodes,
      totalEpisodes: d.episodes ?? episodes.length,
      duration: d.duration ?? null,
      aired: d.aired ?? null,
      studio: d.studios ?? null,
      studios: d.studios ?? null,
      synopsis: synopsisText,
      genres: (d.genreList ?? []).map((g) => g.title),
      batch: d.batch
        ? {
            title: d.batch.title,
            batchId: d.batch.batchId,
            href: d.batch.href,
            otakudesuUrl: d.batch.otakudesuUrl,
          }
        : null,
      recommended,
    };
  } catch (error) {
    console.error(`Error in getDetail for ${id}:`, error);
    throw error;
  }
}

interface ApiEpisodeResponse {
  status: string;
  data: {
    title: string;
    animeId: string;
    releaseTime?: string;
    defaultStreamingUrl: string;
    hasPrevEpisode: boolean;
    prevEpisode?: {
      title?: string;
      episodeId: string;
      href?: string;
    } | null;
    hasNextEpisode: boolean;
    nextEpisode?: {
      title?: string;
      episodeId: string;
      href?: string;
    } | null;
    server?: {
      qualities?: {
        title: string;
        serverList?: {
          title: string;
          serverId: string;
          href?: string;
        }[];
      }[];
    };
    downloadUrl?: {
      qualities?: {
        title: string;
        size: string;
        urls: {
          title: string;
          url: string;
        }[];
      }[];
    };
    info?: {
      credit?: string;
      encoder?: string;
      duration?: string;
      type?: string;
      genreList?: { title: string; genreId: string }[];
      episodeList?: {
        title: string;
        eps: number;
        episodeId: string;
      }[];
    };
  };
}

export async function getStream(episodeId: string): Promise<StreamResult> {
  try {
    const json = await fetchJson<ApiEpisodeResponse>(
      `${getApiBase()}/episode/${encodeURIComponent(episodeId)}`,
    );
    const d = json.data;

    const qualities = (d.server?.qualities ?? []).map((q) => ({
      quality: q.title,
      serverList: (q.serverList ?? []).map((s) => ({
        title: s.title.trim(),
        serverId: s.serverId,
        href: s.href,
      })),
    }));

    const downloads = (d.downloadUrl?.qualities ?? []).map((q) => ({
      quality: q.title,
      size: q.size ?? null,
      urls: (q.urls ?? []).map((u) => ({
        title: u.title,
        url: u.url,
      })),
    }));

    return {
      title: d.title,
      animeId: d.animeId,
      episodeId,
      releaseTime: d.releaseTime ?? null,
      defaultStreamingUrl: d.defaultStreamingUrl || null,
      hasPrevEpisode: Boolean(d.hasPrevEpisode),
      prevEpisodeId: d.prevEpisode?.episodeId ?? null,
      hasNextEpisode: Boolean(d.hasNextEpisode),
      nextEpisodeId: d.nextEpisode?.episodeId ?? null,
      servers: {
        qualities,
      },
      downloads,
      info: d.info,
    };
  } catch (error) {
    console.error(`Error in getStream for ${episodeId}:`, error);
    throw error;
  }
}

interface ApiServerResponse {
  status: string;
  data: {
    url: string;
  };
}

export async function resolveServer(serverId: string): Promise<{ url: string }> {
  try {
    const json = await fetchJson<ApiServerResponse>(
      `${getApiBase()}/server/${encodeURIComponent(serverId)}`,
    );
    return { url: json.data?.url || "" };
  } catch (error) {
    console.error(`Error resolving server ${serverId}:`, error);
    return { url: "" };
  }
}

interface ApiBatchResponse {
  status: string;
  data: BatchDetail;
}

export async function getBatch(batchId: string): Promise<BatchDetail | null> {
  try {
    const json = await fetchJson<ApiBatchResponse>(
      `${getApiBase()}/batch/${encodeURIComponent(batchId)}`,
    );
    return json.data ?? null;
  } catch (error) {
    console.error(`Error in getBatch for ${batchId}:`, error);
    return null;
  }
}
