import { cached } from "./cache.server";
import { fetchJson, parseNumber, slugify } from "./http.server";
import { makeItem, toAnimeId, toEpisodeId } from "./ids";
import { formatSafePoster } from "./poster.server";
import type {
  AnimeSource,
  HomeFeed,
  SourceDetail,
  SourceEpisode,
  SourceGenre,
  SourceItem,
  SourcePage,
  SourceStream,
} from "./types";

const BASE_URL = "https://animeinweb.com";
const API_BASE = "https://animeinweb.com/api/proxy";
const PROXY_SECRET = "animein-secure-proxy-key-123";
const EPISODES_PER_PAGE = 30;
const MAX_EPISODE_PAGES = 10;

const DAYS_ID = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

interface RawAnime {
  id?: string | number;
  title?: string;
  synonyms?: string;
  type?: string;
  status?: string;
  day?: string;
  year?: string | number;
  views?: string | number;
  genre?: string | string[];
  genres?: string | string[];
  image_poster?: string;
  poster?: string;
  image_cover?: string;
  cover?: string;
  aired_start?: string;
  aired_end?: string;
  synopsis?: string;
  studio?: string;
  score?: string | number;
  rating?: string | number;
}

interface RawEpisode {
  id?: string | number;
  index?: string | number;
  title?: string;
  key_time?: string;
}

interface RawServer {
  id?: string | number;
  name?: string;
  quality?: string;
  link?: string;
}

interface Envelope<T> {
  data?: T;
}

function headers(): Record<string, string> {
  return {
    Referer: `${BASE_URL}/`,
    Origin: BASE_URL,
    "x-proxy-secret": PROXY_SECRET,
  };
}

async function api<T>(path: string): Promise<T | undefined> {
  const json = await fetchJson<Envelope<T>>(`${API_BASE}${path}`, {
    source: "animein",
    headers: headers(),
    timeoutMs: 10000,
  });
  return json.data;
}

function parseGenres(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function toItem(raw: RawAnime): SourceItem | null {
  if (raw.id === undefined || raw.id === null || !raw.title) return null;
  const poster = formatSafePoster(raw.image_poster || raw.poster, raw.title);
  const cover = formatSafePoster(
    raw.image_cover || raw.cover || raw.image_poster || raw.poster,
    raw.title,
  );
  return makeItem("animein", String(raw.id), {
    title: raw.title,
    poster,
    cover,
    type: raw.type,
    status: raw.status,
    score: raw.score ?? raw.rating ?? null,
    year: raw.year ?? null,
    genres: parseGenres(raw.genre ?? raw.genres),
    synopsis: raw.synopsis,
    day: raw.day,
    views: parseNumber(raw.views),
  });
}

function toItems(list: RawAnime[] | undefined): SourceItem[] {
  return (list ?? []).map(toItem).filter((item): item is SourceItem => item !== null);
}

async function explore(sort: string, keyword: string, page: number): Promise<SourcePage> {
  const p = Math.max(0, page - 1);
  const data = await api<{ movie?: RawAnime[] }>(
    `/3/2/explore/movie?page=${p}&sort=${encodeURIComponent(sort)}&keyword=${encodeURIComponent(keyword)}`,
  );
  const items = toItems(data?.movie);
  return { items, hasNext: items.length >= 20 };
}

async function loadGenres(): Promise<SourceGenre[]> {
  return cached("animein:genres", 60 * 60 * 1000, async () => {
    const data = await api<{ genre?: { id?: string | number; name?: string; image?: string }[] }>(
      "/3/2/explore/genre",
    );
    return (data?.genre ?? [])
      .filter((g) => g.id !== undefined && g.name)
      .map((g) => ({ id: String(g.id), name: g.name ?? "", image: g.image ?? null }));
  });
}

async function loadEpisodes(id: string): Promise<SourceEpisode[]> {
  const episodes: SourceEpisode[] = [];
  for (let page = 0; page < MAX_EPISODE_PAGES; page++) {
    let batch: RawEpisode[] = [];
    try {
      const data = await api<{ episode?: RawEpisode[] }>(
        `/3/2/movie/episode/${encodeURIComponent(id)}?page=${page}`,
      );
      batch = data?.episode ?? [];
    } catch {
      break;
    }
    if (batch.length === 0) break;
    for (const e of batch) {
      if (e.id === undefined || e.id === null) continue;
      episodes.push({
        id: toEpisodeId("animein", String(e.id)),
        number: parseNumber(e.index) ?? episodes.length + 1,
        title: e.title || `Episode ${e.index ?? episodes.length + 1}`,
        date: e.key_time ?? null,
      });
    }
    if (batch.length < EPISODES_PER_PAGE) break;
  }
  return episodes;
}

export const animein: AnimeSource = {
  id: "animein",
  label: "AnimeIn",
  homeUsesDay: true,

  async getHome(day) {
    const dayName = day ? day.toUpperCase() : (DAYS_ID[new Date().getDay()] ?? "SENIN");
    const data = await api<{
      today?: RawAnime[];
      popular?: RawAnime[];
      new?: RawAnime[];
      hot?: RawAnime[];
      slider?: RawAnime[];
      waiting?: RawAnime[];
    }>(`/3/2/home/data?day=${encodeURIComponent(dayName)}&limit=20`);
    const feed: HomeFeed = {
      today: toItems(data?.today),
      popular: toItems(data?.popular),
      latest: toItems(data?.new),
      hot: toItems(data?.hot),
      slider: toItems(data?.slider),
      waiting: toItems(data?.waiting),
    };
    return feed;
  },

  getLatest: (page) => explore("latest", "", page),
  getPopular: (page) => explore("views", "", page),

  async search(keyword, page) {
    if (!keyword.trim()) return { items: [], hasNext: false };
    return explore("views", keyword.trim(), page);
  },

  async getGenres() {
    return loadGenres();
  },

  async getByGenre(genre, page) {
    const cleanGenre = genre
      .replace(/\s*\(\s*\d+\s*\)/g, "")
      .replace(/\s*anime$/i, "")
      .replace(/-anime$/i, "")
      .trim();
    const wanted = slugify(cleanGenre);
    const genres = await loadGenres();
    const target = genres.find(
      (g) =>
        slugify(g.name) === wanted ||
        slugify(g.name).includes(wanted) ||
        wanted.includes(slugify(g.name)) ||
        g.id === genre,
    );
    if (!target) return { items: [], hasNext: false };

    const p = Math.max(0, page - 1);
    const data = await api<{ movie?: RawAnime[] }>(
      `/3/2/explore/movie/genre/${encodeURIComponent(target.id)}?page=${p}`,
    );
    const items = toItems(data?.movie);
    return { items, hasNext: items.length >= 20 };
  },

  async getSchedule() {
    const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
    const results = await Promise.allSettled(
      days.map((d) => api<{ today?: RawAnime[] }>(`/3/2/home/data?day=${d}&limit=50`)),
    );
    const schedule: Record<string, SourceItem[]> = {};
    days.forEach((d, i) => {
      const res = results[i];
      schedule[d] = res && res.status === "fulfilled" ? toItems(res.value?.today) : [];
    });
    return schedule;
  },

  async getDetail(slug) {
    const id = slug.replace(/^https?:\/\/animeinweb\.com\/anime\//i, "").split(/[/?]/)[0] ?? slug;
    const data = await api<{ movie?: RawAnime }>(`/3/2/movie/detail/${encodeURIComponent(id)}`);
    const movie = data?.movie;
    if (!movie || !movie.title) throw new Error(`Anime ${id} tidak ditemukan`);

    const base = toItem({ ...movie, id });
    const episodes = await loadEpisodes(id);
    const detail: SourceDetail = {
      id: toAnimeId("animein", id),
      source: "animein",
      title: movie.title,
      japanese: movie.synonyms ?? null,
      poster: base?.poster ?? null,
      cover: base?.cover ?? null,
      synopsis: movie.synopsis ?? null,
      status: movie.status ?? null,
      type: movie.type ?? null,
      score: base?.score ?? null,
      genres: base?.genres ?? [],
      studio: movie.studio && movie.studio !== "-" ? movie.studio : null,
      producers: null,
      duration: null,
      aired:
        movie.aired_start && movie.aired_end
          ? `${movie.aired_start} s/d ${movie.aired_end}`
          : (movie.aired_start ?? null),
      year: movie.year !== undefined ? String(movie.year) : null,
      episodes,
      recommended: [],
    };
    return detail;
  },

  async getStream(slug) {
    const epId = slug.split(/[/?]/)[0] ?? slug;
    const data = await api<{
      episode?: RawEpisode & { movie_id?: string | number; anime_id?: string | number };
      episode_next?: { id?: string | number } | null;
      movie?: { id?: string | number };
      server?: RawServer[];
    }>(`/3/2/episode/streamnew/${encodeURIComponent(epId)}`);

    const servers = (data?.server ?? [])
      .filter((s) => s.link)
      .map((s) => {
        const q = s.quality || "Auto";
        const qLabel = q === "1080p" ? "1080p FHD" : q === "720p" ? "720p HD" : q;
        const sName = s.name || "Server";
        return {
          name: `${sName} (Sub Indo ${qLabel})`,
          quality: q,
          ref: { kind: "url" as const, url: s.link ?? "" },
        };
      })
      .sort((a, b) => {
        const weight = (q: string) =>
          q.includes("1080") ? 1080 : q.includes("720") ? 720 : q.includes("480") ? 480 : 360;
        return weight(b.quality) - weight(a.quality);
      });

    const owner = data?.movie?.id ?? data?.episode?.movie_id ?? data?.episode?.anime_id;
    const nextId = data?.episode_next?.id;

    const stream: SourceStream = {
      id: toEpisodeId("animein", epId),
      animeId: owner !== undefined ? toAnimeId("animein", String(owner)) : "",
      title: data?.episode?.title || `Episode ${epId}`,
      releaseTime: data?.episode?.key_time ?? null,
      servers,
      downloads: [],
      prevEpisodeId: null,
      nextEpisodeId:
        nextId !== undefined && nextId !== null ? toEpisodeId("animein", String(nextId)) : null,
    };
    return stream;
  },
};
