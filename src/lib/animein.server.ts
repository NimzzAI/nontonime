import type {
  AnimeDetail,
  AnimeSummary,
  BatchDetail,
  DirectoryGroup,
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

// Bounded LRU Cache (max 400 entries) to prevent memory growth
const MAX_CACHE_ENTRIES = 400;
const cache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const lastSuccessfulResponse = new Map<string, unknown>();

function setCache<T>(key: string, data: T, ttlMs: number) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Delete oldest entry
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expires: Date.now() + ttlMs });
  lastSuccessfulResponse.set(key, data);
}

async function fetchJson<T>(url: string, ttlMs = 10 * 60 * 1000): Promise<T> {
  // 1. Check valid memory cache
  const cached = cache.get(url);
  if (cached && Date.now() < cached.expires) {
    return cached.data as T;
  }

  // 2. Coalesce duplicate in-flight requests
  const inFlight = inFlightRequests.get(url);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const fetchPromise = (async (): Promise<T> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let res: Response;
      try {
        res = await fetch(url, {
          headers: BROWSER_HEADERS,
          signal: controller.signal,
        });
      } catch (netErr) {
        clearTimeout(timeoutId);
        const fallbackBase = getFallbackApiBase();
        if (fallbackBase && !url.startsWith(fallbackBase)) {
          const fallbackUrl = url.replace(getApiBase(), fallbackBase);
          console.warn(`[API] Network error on ${url}. Retrying with fallback: ${fallbackUrl}`);
          return await fetchJson<T>(fallbackUrl, ttlMs);
        }
        const stale = lastSuccessfulResponse.get(url);
        if (stale) {
          console.warn(`[API] Network error on ${url}. Serving stale fallback response.`);
          return stale as T;
        }
        throw netErr;
      } finally {
        clearTimeout(timeoutId);
      }

      if (res.status === 403) {
        const fallbackBase = getFallbackApiBase();
        if (fallbackBase && !url.startsWith(fallbackBase)) {
          const fallbackUrl = url.replace(getApiBase(), fallbackBase);
          console.warn(`[API] 403 on ${url}. Retrying with fallback: ${fallbackUrl}`);
          return await fetchJson<T>(fallbackUrl, ttlMs);
        }
        const stale = lastSuccessfulResponse.get(url);
        if (stale) {
          console.warn(`[API] 403 on ${url}. Serving stale fallback response.`);
          return stale as T;
        }
      }

      if (!res.ok) {
        const stale = lastSuccessfulResponse.get(url);
        if (stale) {
          console.warn(`[API] Error ${res.status}. Serving stale response.`);
          return stale as T;
        }
        throw new Error(`API fetch error ${res.status}: ${res.statusText} at ${url}`);
      }

      const json = await res.json();
      setCache(url, json, ttlMs);
      return json as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/* ========================================================================== */
/*                              HOME SECTIONS                                 */
/* ========================================================================== */

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

export async function getHome(
  dayFilter?: string | null,
  _provider = "otakudesu",
): Promise<HomeSections> {
  try {
    const json = await fetchJson<ApiHomeResponse>(`${getApiBase()}/home`, 5 * 60 * 1000);
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

/* ========================================================================== */
/*                             LATEST & COMPLETED                             */
/* ========================================================================== */

interface ApiOngoingResponse {
  status: string;
  data: {
    animeList: {
      title: string;
      poster: string;
      episodes?: number | string;
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

export async function getLatest(page = 1, _provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);

  try {
    const json = await fetchJson<ApiOngoingResponse>(
      `${getApiBase()}/ongoing-anime?page=${safePage}`,
      5 * 60 * 1000,
    );
    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
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
      episodes?: number | string;
      score?: string;
      lastReleaseDate?: string;
      animeId: string;
      type?: string;
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

export async function getCompleted(page = 1, _provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);

  try {
    const json = await fetchJson<ApiCompletedResponse>(
      `${getApiBase()}/complete-anime?page=${safePage}`,
      10 * 60 * 1000,
    );
    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      episodeCount:
        typeof a.episodes === "number" ? a.episodes : parseInt(String(a.episodes || 0), 10) || null,
      score: a.score ?? null,
      status: "Completed",
      type: "TV",
      latestReleaseDate: a.lastReleaseDate ?? null,
      genres: (a.genreList ?? []).map((g) => g.title),
    }));

    return {
      items,
      page: safePage,
      hasNext: Boolean(json.pagination?.hasNextPage),
      totalPages: json.pagination?.totalPages ?? 1,
      pagination: json.pagination,
    };
  } catch (error) {
    console.error("Error in getCompleted:", error);
    throw error;
  }
}

export async function getPopular(page = 1, provider = "otakudesu"): Promise<ListResult> {
  return getCompleted(page, provider);
}

/* ========================================================================== */
/*                                   SEARCH                                   */
/* ========================================================================== */

interface ApiSearchResponse {
  status: string;
  data: {
    animeList: {
      title: string;
      poster: string;
      status?: string;
      score?: string;
      type?: string;
      animeId: string;
      genreList?: { title: string; genreId: string }[];
    }[];
  };
}

export async function search(
  keyword: string,
  page = 1,
  _provider = "otakudesu",
): Promise<ListResult> {
  if (!keyword || !keyword.trim()) {
    return { items: [], page: 1, hasNext: false };
  }

  const safeKeyword = keyword.trim();

  try {
    const json = await fetchJson<ApiSearchResponse>(
      `${getApiBase()}/search/${encodeURIComponent(safeKeyword)}`,
      5 * 60 * 1000,
    );
    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      status: a.status ?? null,
      score: a.score ?? null,
      type: a.type ?? "TV",
      genres: (a.genreList ?? []).map((g) => g.title),
    }));

    return {
      items,
      page,
      hasNext: false,
      totalPages: 1,
    };
  } catch (error) {
    console.error("Error in search:", error);
    throw error;
  }
}

/* ========================================================================== */
/*                                   GENRES                                   */
/* ========================================================================== */

interface ApiGenreResponse {
  status: string;
  data: {
    genreList: {
      title: string;
      genreId: string;
    }[];
  };
}

export async function getGenres(_provider = "otakudesu"): Promise<GenreItem[]> {
  try {
    const json = await fetchJson<ApiGenreResponse>(`${getApiBase()}/genre`, 60 * 60 * 1000);
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

export async function getByGenre(
  genreId: string,
  page = 1,
  _sort = "views",
  _provider = "otakudesu",
): Promise<ListResult> {
  const safePage = Math.max(1, page);

  try {
    const json = await fetchJson<ApiByGenreResponse>(
      `${getApiBase()}/genre/${encodeURIComponent(genreId)}?page=${safePage}`,
      15 * 60 * 1000,
    );

    const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
      id: a.animeId,
      title: a.title,
      poster: a.poster,
      score: a.score ?? null,
      episodeCount: typeof a.episodes === "number" ? a.episodes : null,
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
    console.error(`Error in getByGenre for ${genreId}:`, error);
    throw error;
  }
}

/* ========================================================================== */
/*                                  SCHEDULE                                  */
/* ========================================================================== */

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

export async function getSchedule(_provider = "otakudesu"): Promise<ScheduleMap> {
  try {
    const json = await fetchJson<ApiScheduleResponse>(`${getApiBase()}/schedule`, 30 * 60 * 1000);
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

/* ========================================================================== */
/*                                 DIRECTORY                                  */
/* ========================================================================== */

interface ApiUnlimitedResponse {
  status: string;
  data: {
    list: DirectoryGroup[];
  };
}

export async function getDirectory(_provider = "otakudesu"): Promise<DirectoryGroup[]> {
  try {
    const json = await fetchJson<ApiUnlimitedResponse>(`${getApiBase()}/unlimited`, 60 * 60 * 1000);
    return json.data?.list ?? [];
  } catch (error) {
    console.error("Error in getDirectory:", error);
    return [];
  }
}

/* ========================================================================== */
/*                                ANIME DETAIL                                */
/* ========================================================================== */

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
    }[];
    recommendedAnimeList?: {
      title: string;
      poster: string;
      animeId: string;
    }[];
  };
}

export async function getDetail(id: string, _provider = "otakudesu"): Promise<AnimeDetail> {
  try {
    const json = await fetchJson<ApiDetailResponse>(
      `${getApiBase()}/anime/${encodeURIComponent(id)}`,
      15 * 60 * 1000,
    );
    const d = json.data;

    return {
      id,
      title: d.title,
      poster: d.poster,
      japanese: d.japanese ?? null,
      score: d.score ?? null,
      producers: d.producers ?? null,
      type: d.type ?? null,
      status: d.status ?? null,
      episodeCount: d.episodes ?? null,
      duration: d.duration ?? null,
      aired: d.aired ?? null,
      studio: d.studios ?? null,
      studios: d.studios ?? null,
      batch: d.batch
        ? {
            title: d.batch.title,
            batchId: d.batch.batchId,
            href: d.batch.href,
            otakudesuUrl: d.batch.otakudesuUrl,
          }
        : null,
      synopsis: d.synopsis?.paragraphs?.join("\n\n") ?? null,
      genres: (d.genreList ?? []).map((g) => g.title),
      episodes: (d.episodeList ?? []).map((e) => ({
        id: e.episodeId,
        number: e.eps,
        title: e.title,
        releaseDate: e.date ?? null,
      })),
      recommended: (d.recommendedAnimeList ?? []).map((r) => ({
        id: r.animeId,
        title: r.title,
        poster: r.poster,
      })),
    };
  } catch (error) {
    console.error(`Error in getDetail for ${id}:`, error);
    throw error;
  }
}

/* ========================================================================== */
/*                               STREAM & RESOLVE                             */
/* ========================================================================== */

interface ApiEpisodeResponse {
  status: string;
  data: {
    title: string;
    animeId: string;
    releaseTime?: string;
    defaultStreamingUrl?: string;
    hasPrevEpisode: boolean;
    prevEpisode?: { title?: string; episodeId: string } | null;
    hasNextEpisode: boolean;
    nextEpisode?: { title?: string; episodeId: string } | null;
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
        size?: string;
        urls?: { title: string; url: string }[];
      }[];
    };
    info?: {
      credit?: string;
      encoder?: string;
      duration?: string;
      type?: string;
      genreList?: { title: string; genreId: string }[];
      episodeList?: { title: string; eps: number; episodeId: string }[];
    };
  };
}

export async function extractDirectStreamUrl(embedUrl: string): Promise<string | null> {
  if (!embedUrl) return null;
  if (/\.(m3u8|mp4)(\?|$)/i.test(embedUrl)) {
    return embedUrl;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(embedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://otakudesu.cloud/",
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const html = await res.text();
    const matchVar = html.match(/videoURL\s*=\s*["']([^"']+)["']/i);
    if (matchVar?.[1]) return matchVar[1];
    const matchSrc = html.match(/<(?:source|video)[^>]+src=["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (matchSrc?.[1]) return matchSrc[1];
    const matchFile = html.match(/(?:file|source|src)\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (matchFile?.[1]) return matchFile[1];
    return null;
  } catch {
    return null;
  }
}

export async function getStream(episodeId: string, _provider = "otakudesu"): Promise<StreamResult> {
  try {
    const json = await fetchJson<ApiEpisodeResponse>(
      `${getApiBase()}/episode/${encodeURIComponent(episodeId)}`,
      3 * 60 * 1000,
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

    let directUrl: string | null = null;
    if (d.defaultStreamingUrl) {
      directUrl = await extractDirectStreamUrl(d.defaultStreamingUrl);
    }

    return {
      title: d.title,
      animeId: d.animeId,
      episodeId,
      releaseTime: d.releaseTime ?? null,
      defaultStreamingUrl: directUrl || d.defaultStreamingUrl || null,
      directUrl: directUrl || null,
      embedUrl: d.defaultStreamingUrl || null,
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

export async function resolveServer(
  serverId: string,
  _provider = "otakudesu",
): Promise<{ url: string }> {
  try {
    const json = await fetchJson<ApiServerResponse>(
      `${getApiBase()}/server/${encodeURIComponent(serverId)}`,
      60 * 1000,
    );
    const rawUrl = json.data?.url || "";
    if (rawUrl) {
      const direct = await extractDirectStreamUrl(rawUrl);
      return { url: direct || rawUrl };
    }
  } catch (error) {
    console.error(`Error resolving server ${serverId}:`, error);
  }
  return { url: "" };
}

/* ========================================================================== */
/*                                   BATCH                                    */
/* ========================================================================== */

interface ApiBatchResponse {
  status: string;
  data: BatchDetail;
}

export async function getBatch(
  batchId: string,
  _provider = "otakudesu",
): Promise<BatchDetail | null> {
  try {
    const json = await fetchJson<ApiBatchResponse>(
      `${getApiBase()}/batch/${encodeURIComponent(batchId)}`,
      30 * 60 * 1000,
    );
    if (json.data) return json.data;
  } catch (error) {
    console.error(`Error in getBatch for ${batchId}:`, error);
  }
  return null;
}
