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

interface SamehadakuHomeResponse {
  status: string;
  data: {
    recent?: {
      animeList?: {
        title: string;
        poster: string;
        episodes?: string | number;
        releasedOn?: string;
        animeId: string;
        href?: string;
      }[];
    };
    batch?: {
      batchList?: unknown[];
    };
    movie?: {
      animeList?: {
        title: string;
        poster: string;
        releaseDate?: string;
        animeId: string;
        href?: string;
        genreList?: { title: string; genreId: string }[];
      }[];
    };
    top10?: {
      animeList?: {
        rank: number;
        title: string;
        poster: string;
        score?: string;
        animeId: string;
        href?: string;
      }[];
    };
  };
}

export async function getHome(
  dayFilter?: string | null,
  provider = "otakudesu",
): Promise<HomeSections> {
  const isSamehadaku = provider === "samehadaku";

  if (isSamehadaku) {
    try {
      const json = await fetchJson<SamehadakuHomeResponse>(`${getApiBase()}/samehadaku/home`);
      const recentRaw = json.data?.recent?.animeList ?? [];
      const top10Raw = json.data?.top10?.animeList ?? [];
      const movieRaw = json.data?.movie?.animeList ?? [];

      const recent: AnimeSummary[] = recentRaw.map((a) => ({
        id: a.animeId,
        title: a.title,
        poster: a.poster,
        episodeCount:
          typeof a.episodes === "number"
            ? a.episodes
            : parseInt(String(a.episodes || 0), 10) || null,
        status: "Ongoing",
        type: "TV",
        latestReleaseDate: a.releasedOn ?? null,
        genres: [],
      }));

      const top10: AnimeSummary[] = top10Raw.map((a) => ({
        id: a.animeId,
        title: a.title,
        poster: a.poster,
        score: a.score ?? null,
        status: "Popular",
        type: "TV",
        genres: [],
      }));

      const movies: AnimeSummary[] = movieRaw.map((a) => ({
        id: a.animeId,
        title: a.title,
        poster: a.poster,
        status: "Movie",
        type: "Movie",
        latestReleaseDate: a.releaseDate ?? null,
        genres: (a.genreList ?? []).map((g) => g.title),
      }));

      // Combined and balanced sections for Samehadaku
      const slider = top10.length > 0 ? top10.slice(0, 6) : recent.slice(0, 6);

      return {
        slider,
        today: recent.slice(0, 12),
        hot: top10.slice(0, 10),
        popular: top10.slice(0, 10),
        new: recent.slice(0, 12),
        waiting: movies.length > 0 ? movies.slice(0, 8) : recent.slice(6, 12),
      };
    } catch (err) {
      console.error("Error fetching Samehadaku home, falling back to Otakudesu:", err);
      // Fallback seamlessly to Otakudesu
    }
  }

  // Default: Otakudesu Home
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

/* ========================================================================== */
/*                             LATEST & POPULAR                               */
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
      type?: string;
      score?: string;
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

export async function getLatest(page = 1, provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);

  if (provider === "samehadaku") {
    try {
      const json = await fetchJson<ApiOngoingResponse>(
        `${getApiBase()}/samehadaku/ongoing?page=${safePage}`,
      );
      const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
        id: a.animeId,
        title: a.title,
        poster: a.poster,
        episodeCount:
          typeof a.episodes === "number"
            ? a.episodes
            : parseInt(String(a.episodes || 0), 10) || null,
        status: "Ongoing",
        score: a.score ?? null,
        type: a.type ?? "TV",
        genres: (a.genreList ?? []).map((g) => g.title),
      }));

      return {
        items,
        page: safePage,
        hasNext: Boolean(json.pagination?.hasNextPage),
        totalPages: json.pagination?.totalPages ?? 1,
        pagination: json.pagination,
      };
    } catch (err) {
      console.warn("Failed fetching Samehadaku ongoing, falling back to Otakudesu:", err);
    }
  }

  // Otakudesu Ongoing
  try {
    const json = await fetchJson<ApiOngoingResponse>(
      `${getApiBase()}/ongoing-anime?page=${safePage}`,
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

export async function getPopular(page = 1, provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);

  if (provider === "samehadaku") {
    try {
      const json = await fetchJson<ApiCompletedResponse>(
        `${getApiBase()}/samehadaku/popular?page=${safePage}`,
      );
      const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
        id: a.animeId,
        title: a.title,
        poster: a.poster,
        score: a.score ?? null,
        status: "Popular",
        type: a.type ?? "TV",
        genres: (a.genreList ?? []).map((g) => g.title),
      }));

      return {
        items,
        page: safePage,
        hasNext: Boolean(json.pagination?.hasNextPage),
        totalPages: json.pagination?.totalPages ?? 1,
        pagination: json.pagination,
      };
    } catch (err) {
      console.warn("Failed fetching Samehadaku popular, falling back to Otakudesu:", err);
    }
  }

  // Otakudesu Completed / Popular
  try {
    const json = await fetchJson<ApiCompletedResponse>(
      `${getApiBase()}/complete-anime?page=${safePage}`,
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

export async function getCompleted(page = 1, provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);

  if (provider === "samehadaku") {
    try {
      const json = await fetchJson<ApiCompletedResponse>(
        `${getApiBase()}/samehadaku/completed?page=${safePage}`,
      );
      const items: AnimeSummary[] = (json.data?.animeList ?? []).map((a) => ({
        id: a.animeId,
        title: a.title,
        poster: a.poster,
        score: a.score ?? null,
        status: "Completed",
        type: a.type ?? "TV",
        genres: (a.genreList ?? []).map((g) => g.title),
      }));

      return {
        items,
        page: safePage,
        hasNext: Boolean(json.pagination?.hasNextPage),
        totalPages: json.pagination?.totalPages ?? 1,
        pagination: json.pagination,
      };
    } catch (err) {
      console.warn("Failed fetching Samehadaku completed, falling back:", err);
    }
  }

  return getPopular(safePage, "otakudesu");
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
      animeId: string;
      genreList?: { title: string; genreId: string }[];
    }[];
  };
}

export async function search(keyword: string, page = 1, provider = "otakudesu"): Promise<ListResult> {
  if (!keyword || !keyword.trim()) {
    return { items: [], page: 1, hasNext: false };
  }

  const safeKeyword = keyword.trim();

  if (provider === "samehadaku") {
    try {
      const json = await fetchJson<ApiOngoingResponse>(
        `${getApiBase()}/samehadaku/search?q=${encodeURIComponent(safeKeyword)}&page=${page}`,
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
        hasNext: Boolean(json.pagination?.hasNextPage),
        totalPages: json.pagination?.totalPages ?? 1,
        pagination: json.pagination,
      };
    } catch (err) {
      console.warn("Samehadaku search failed, falling back to Otakudesu:", err);
    }
  }

  // Otakudesu Search
  try {
    const json = await fetchJson<ApiSearchResponse>(
      `${getApiBase()}/search/${encodeURIComponent(safeKeyword)}`,
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

export async function getGenres(provider = "otakudesu"): Promise<GenreItem[]> {
  const endpoint = provider === "samehadaku" ? "/samehadaku/genres" : "/genre";
  try {
    const json = await fetchJson<ApiGenreResponse>(`${getApiBase()}${endpoint}`);
    return (json.data?.genreList ?? []).map((g) => ({
      id: g.genreId,
      name: g.title,
    }));
  } catch (error) {
    console.error(`Error in getGenres (${provider}):`, error);
    // fallback if samehadaku failed
    if (provider === "samehadaku") {
      return getGenres("otakudesu");
    }
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
  provider = "otakudesu",
): Promise<ListResult> {
  const safePage = Math.max(1, page);
  const endpoint =
    provider === "samehadaku"
      ? `/samehadaku/genres/${encodeURIComponent(genreId)}?page=${safePage}`
      : `/genre/${encodeURIComponent(genreId)}?page=${safePage}`;

  try {
    const json = await fetchJson<ApiByGenreResponse>(`${getApiBase()}${endpoint}`);

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
    console.error(`Error in getByGenre (${provider}):`, error);
    if (provider === "samehadaku") {
      return getByGenre(genreId, page, _sort, "otakudesu");
    }
    throw error;
  }
}

/* ========================================================================== */
/*                                  SCHEDULE                                  */
/* ========================================================================== */

const SAMEHADAKU_DAY_MAP: Record<string, string> = {
  sunday: "Minggu",
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
};

interface SamehadakuScheduleResponse {
  status: string;
  data: {
    days?: {
      day: string;
      animeList?: {
        title: string;
        poster: string;
        type?: string;
        score?: string;
        estimation?: string;
        genres?: string;
        animeId: string;
        href?: string;
      }[];
    }[];
  };
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

export async function getSchedule(provider = "otakudesu"): Promise<ScheduleMap> {
  if (provider === "samehadaku") {
    try {
      const json = await fetchJson<SamehadakuScheduleResponse>(
        `${getApiBase()}/samehadaku/schedule`,
      );
      const map: ScheduleMap = {};

      for (const item of json.data?.days ?? []) {
        const rawDay = (item.day || "").toLowerCase().trim();
        const indoDay = SAMEHADAKU_DAY_MAP[rawDay] || item.day;
        map[indoDay] = (item.animeList ?? []).map((a) => ({
          id: a.animeId,
          title: a.title,
          poster: a.poster,
          releaseDay: indoDay,
          day: indoDay,
          status: "Ongoing",
          score: a.score ?? null,
          genres: a.genres ? a.genres.split(",").map((s) => s.trim()) : [],
        }));
      }

      return map;
    } catch (err) {
      console.warn("Failed fetching Samehadaku schedule, falling back to Otakudesu:", err);
    }
  }

  // Otakudesu Schedule
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

/* ========================================================================== */
/*                                 DIRECTORY                                  */
/* ========================================================================== */

interface ApiUnlimitedResponse {
  status: string;
  data: {
    list: DirectoryGroup[];
  };
}

export async function getDirectory(provider = "otakudesu"): Promise<DirectoryGroup[]> {
  const endpoint = provider === "samehadaku" ? "/samehadaku/list" : "/unlimited";
  try {
    const json = await fetchJson<ApiUnlimitedResponse>(`${getApiBase()}${endpoint}`);
    return json.data?.list ?? [];
  } catch (error) {
    console.error(`Error in getDirectory (${provider}):`, error);
    if (provider === "samehadaku") {
      return getDirectory("otakudesu");
    }
    return [];
  }
}

/* ========================================================================== */
/*                                ANIME DETAIL                                */
/* ========================================================================== */

interface SamehadakuDetailResponse {
  status: string;
  data: {
    title?: string;
    poster: string;
    score?: { value: string; users?: string } | string;
    japanese?: string;
    synonyms?: string;
    english?: string;
    status?: string;
    type?: string;
    source?: string;
    duration?: string;
    episodes?: number | string;
    season?: string;
    studios?: string;
    producers?: string;
    aired?: string;
    trailer?: string;
    synopsis?: {
      paragraphs?: string[];
      connections?: { title: string; animeId: string; href?: string }[];
    };
    genreList?: { title: string; genreId: string }[];
    batchList?: { title: string; batchId: string; href?: string }[];
    episodeList?: {
      title: string | number;
      episodeId: string;
      href?: string;
    }[];
  };
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
    }[];
    recommendedAnimeList?: {
      title: string;
      poster: string;
      animeId: string;
    }[];
  };
}

export async function getDetail(id: string, provider = "otakudesu"): Promise<AnimeDetail> {
  const isSamehadaku = provider === "samehadaku";

  if (isSamehadaku) {
    try {
      const json = await fetchJson<SamehadakuDetailResponse>(
        `${getApiBase()}/samehadaku/anime/${encodeURIComponent(id)}`,
      );
      const d = json.data;

      const title =
        d.title && d.title.trim().length > 0
          ? d.title.trim()
          : d.english?.trim() ||
            d.synonyms?.trim() ||
            d.japanese?.trim() ||
            id.replace(/-/g, " ");

      const scoreVal = typeof d.score === "object" ? d.score?.value : d.score;
      const batchItem = d.batchList && d.batchList.length > 0 ? d.batchList[0] : null;

      const episodes: EpisodeSummary[] = (d.episodeList ?? []).map((ep) => {
        let num = typeof ep.title === "number" ? ep.title : 0;
        if (!num) {
          const match =
            String(ep.title).match(/(?:episode|eps|\b)(\d+)/i) ||
            ep.episodeId.match(/(?:episode|eps|\b)(\d+)/i);
          if (match?.[1]) num = parseInt(match[1], 10);
        }
        return {
          id: ep.episodeId,
          number: num || 1,
          title:
            typeof ep.title === "number"
              ? `Episode ${ep.title}`
              : String(ep.title || `Episode ${num || 1}`),
        };
      });

      return {
        id,
        title,
        poster: d.poster || null,
        japanese: d.japanese ?? null,
        score: scoreVal ?? null,
        producers: d.producers ?? null,
        type: d.type ?? "TV",
        status: d.status ?? null,
        episodeCount:
          typeof d.episodes === "number"
            ? d.episodes
            : parseInt(String(d.episodes || 0), 10) || episodes.length,
        duration: d.duration ?? null,
        aired: d.aired ?? null,
        studio: d.studios ?? null,
        studios: d.studios ?? null,
        batch: batchItem ? { title: batchItem.title, batchId: batchItem.batchId } : null,
        synopsis: d.synopsis?.paragraphs?.join("\n\n") ?? null,
        genres: (d.genreList ?? []).map((g) => g.title),
        episodes,
        recommended: [],
      };
    } catch (err) {
      console.warn(`Samehadaku anime detail failed for ${id}, trying Otakudesu:`, err);
    }
  }

  // Otakudesu Detail
  try {
    const json = await fetchJson<ApiDetailResponse>(
      `${getApiBase()}/anime/${encodeURIComponent(id)}`,
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
    // If Otakudesu failed and provider was not explicitly samehadaku, try samehadaku as fallback
    if (!isSamehadaku) {
      try {
        return await getDetail(id, "samehadaku");
      } catch {
        // no-op
      }
    }
    console.error(`Error in getDetail for ${id}:`, error);
    throw error;
  }
}

/* ========================================================================== */
/*                               STREAM & RESOLVE                             */
/* ========================================================================== */

interface SamehadakuEpisodeResponse {
  status: string;
  data: {
    title: string;
    animeId: string;
    poster: string;
    releasedOn?: string;
    defaultStreamingUrl?: string;
    hasPrevEpisode: boolean;
    prevEpisode?: { title?: string; episodeId: string; href?: string } | null;
    hasNextEpisode: boolean;
    nextEpisode?: { title?: string; episodeId: string; href?: string } | null;
    synopsis?: {
      paragraphs?: string[];
    };
    genreList?: { title: string; genreId: string }[];
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
      formats?: {
        title: string;
        qualities?: {
          title: string;
          urls?: { title: string; url: string }[];
        }[];
      }[];
      qualities?: {
        title: string;
        size?: string;
        urls?: { title: string; url: string }[];
      }[];
    };
  };
}

interface ApiEpisodeResponse {
  status: string;
  data: {
    title: string;
    animeId: string;
    releaseTime?: string;
    defaultStreamingUrl?: string;
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

export async function extractDirectStreamUrl(embedUrl: string): Promise<string | null> {
  if (!embedUrl) return null;
  // If already direct mp4/m3u8, return as is
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
    // 1. Look for videoURL = "..." (common in Desustream/ODCDN)
    const matchVar = html.match(/videoURL\s*=\s*["']([^"']+)["']/i);
    if (matchVar?.[1]) return matchVar[1];
    // 2. Look for <source src="..." or <video src="..."
    const matchSrc = html.match(/<(?:source|video)[^>]+src=["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (matchSrc?.[1]) return matchSrc[1];
    // 3. Look for file: "..." or source: "..."
    const matchFile = html.match(/(?:file|source|src)\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (matchFile?.[1]) return matchFile[1];
    return null;
  } catch {
    return null;
  }
}

export async function getStream(episodeId: string, provider = "otakudesu"): Promise<StreamResult> {
  const isSamehadaku = provider === "samehadaku";

  if (isSamehadaku) {
    try {
      const json = await fetchJson<SamehadakuEpisodeResponse>(
        `${getApiBase()}/samehadaku/episode/${encodeURIComponent(episodeId)}`,
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

      // Flatten formats from Samehadaku (MKV, MP4, x265) to DownloadQualityGroup
      const downloads: { quality: string; size: string | null; urls: { title: string; url: string }[] }[] = [];
      if (d.downloadUrl?.formats && Array.isArray(d.downloadUrl.formats)) {
        for (const fmt of d.downloadUrl.formats) {
          for (const q of fmt.qualities ?? []) {
            downloads.push({
              quality: `${fmt.title} ${q.title.trim()}`.trim(),
              size: null,
              urls: (q.urls ?? []).map((u) => ({ title: u.title.trim(), url: u.url })),
            });
          }
        }
      } else if (d.downloadUrl?.qualities && Array.isArray(d.downloadUrl.qualities)) {
        for (const q of d.downloadUrl.qualities) {
          downloads.push({
            quality: q.title,
            size: q.size ?? null,
            urls: (q.urls ?? []).map((u) => ({ title: u.title.trim(), url: u.url })),
          });
        }
      }

      let directUrl: string | null = null;
      if (d.defaultStreamingUrl) {
        directUrl = await extractDirectStreamUrl(d.defaultStreamingUrl);
      }

      return {
        title: d.title,
        animeId: d.animeId,
        episodeId,
        releaseTime: d.releasedOn ?? null,
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
      };
    } catch (err) {
      console.warn(`Samehadaku stream failed for ${episodeId}, trying Otakudesu:`, err);
    }
  }

  // Otakudesu Stream
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
    if (!isSamehadaku) {
      try {
        return await getStream(episodeId, "samehadaku");
      } catch {
        // no-op
      }
    }
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
  provider = "otakudesu",
): Promise<{ url: string }> {
  // If provider is Samehadaku or serverId matches Samehadaku format (e.g. includes '-' with letters/digits)
  const isSamehadaku = provider === "samehadaku";

  if (isSamehadaku) {
    try {
      const json = await fetchJson<ApiServerResponse>(
        `${getApiBase()}/samehadaku/server/${encodeURIComponent(serverId)}`,
      );
      const rawUrl = json.data?.url || "";
      if (rawUrl) {
        const direct = await extractDirectStreamUrl(rawUrl);
        return { url: direct || rawUrl };
      }
    } catch (err) {
      console.warn(`Samehadaku resolve failed for ${serverId}, trying Otakudesu:`, err);
    }
  }

  // Otakudesu Resolve
  try {
    const json = await fetchJson<ApiServerResponse>(
      `${getApiBase()}/server/${encodeURIComponent(serverId)}`,
    );
    const rawUrl = json.data?.url || "";
    if (rawUrl) {
      const direct = await extractDirectStreamUrl(rawUrl);
      return { url: direct || rawUrl };
    }
  } catch (error) {
    // If Otakudesu failed and not tried samehadaku yet, try Samehadaku
    if (!isSamehadaku) {
      try {
        const json = await fetchJson<ApiServerResponse>(
          `${getApiBase()}/samehadaku/server/${encodeURIComponent(serverId)}`,
        );
        const rawUrl = json.data?.url || "";
        if (rawUrl) {
          const direct = await extractDirectStreamUrl(rawUrl);
          return { url: direct || rawUrl };
        }
      } catch {
        // no-op
      }
    }
    console.error(`Error resolving server ${serverId}:`, error);
    return { url: "" };
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

export async function getBatch(batchId: string, provider = "otakudesu"): Promise<BatchDetail | null> {
  const isSamehadaku = provider === "samehadaku";

  if (isSamehadaku) {
    try {
      const json = await fetchJson<ApiBatchResponse>(
        `${getApiBase()}/samehadaku/batch/${encodeURIComponent(batchId)}`,
      );
      if (json.data) return json.data;
    } catch (err) {
      console.warn(`Samehadaku batch failed for ${batchId}:`, err);
    }
  }

  // Otakudesu Batch
  try {
    const json = await fetchJson<ApiBatchResponse>(
      `${getApiBase()}/batch/${encodeURIComponent(batchId)}`,
    );
    if (json.data) return json.data;
  } catch (error) {
    if (!isSamehadaku) {
      try {
        const json = await fetchJson<ApiBatchResponse>(
          `${getApiBase()}/samehadaku/batch/${encodeURIComponent(batchId)}`,
        );
        if (json.data) return json.data;
      } catch {
        // no-op
      }
    }
    console.error(`Error in getBatch for ${batchId}:`, error);
    return null;
  }

  return null;
}
