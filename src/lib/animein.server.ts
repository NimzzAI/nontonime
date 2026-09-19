import { getRequestHeader } from "@tanstack/react-start/server";
import type {
  AnimeDetail,
  AnimeSummary,
  EpisodeSummary,
  GenreItem,
  HomeSections,
  ListResult,
  ScheduleMap,
  StreamResult,
} from "./anime-types";

const BASE_URL = "https://animeinweb.com";
const API_BASE = "https://animeinweb.com/api/proxy";
const PROXY_SECRET = "animein-secure-proxy-key-123";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey() {
  const forwarded = getRequestHeader("x-forwarded-for") ?? "";
  return getRequestHeader("cf-connecting-ip") ?? forwarded.split(",")[0]?.trim() ?? "anonymous";
}

function checkRateLimit() {
  const key = clientKey();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    throw new Error("Terlalu banyak permintaan. Coba lagi dalam satu menit.");
  }
}

async function proxyGet<T>(path: string): Promise<T> {
  checkRateLimit();

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `${BASE_URL}/`,
        Origin: BASE_URL,
        "x-proxy-secret": PROXY_SECRET,
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Sumber data sedang tidak dapat dihubungi.");
  }

  if (!response.ok) {
    throw new Error("Sumber data sedang bermasalah. Coba lagi nanti.");
  }

  return (await response.json()) as T;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseGenres(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function cleanId(input: string): string {
  let s = String(input ?? "").trim();
  s = s.replace(/^https?:\/\/animeinweb\.com\/anime\//i, "");
  s = s.replace(/^https?:\/\/animeinweb\.com\/watch\//i, "");
  s = s.split("/")[0]?.split("?")[0]?.trim() ?? "";
  return s;
}

type RawAnimeItem = Record<string, unknown>;

function mapAnimeSummary(item: RawAnimeItem | null | undefined): AnimeSummary | null {
  if (!item) return null;
  return {
    id: String(item["id"] ?? ""),
    title: String(item["title"] ?? ""),
    synonyms: (item["synonyms"] as string) ?? null,
    type: (item["type"] as string) ?? null,
    status: (item["status"] as string) ?? null,
    day: (item["day"] as string) ?? null,
    year: (item["year"] as string | number) ?? null,
    views: toNumber(item["views"]),
    favorites: toNumber(item["favorites"]),
    genres: parseGenres(item["genre"] ?? item["genres"]),
    poster: (item["image_poster"] as string) ?? (item["poster"] as string) ?? null,
    cover: (item["image_cover"] as string) ?? (item["cover"] as string) ?? null,
    airedStart: (item["aired_start"] as string) ?? null,
    synopsis: (item["synopsis"] as string) ?? null,
  };
}

function mapEpisodeImage(raw: unknown): string | null {
  if (!raw) return null;
  const value = String(raw);
  if (value.startsWith("http")) return value;
  return `https://xyz-api.animein.net/${value.replace(/^\/+/, "")}`;
}

function mapEpisode(item: RawAnimeItem): EpisodeSummary {
  return {
    id: String(item["id"] ?? ""),
    number: Number(item["index"] ?? 0),
    title: String(item["title"] ?? ""),
    views: toNumber(item["views"]) ?? 0,
    releaseDate: (item["key_time"] as string) ?? null,
    image: mapEpisodeImage(item["image"]),
    isNew: item["is_new"] === "1",
  };
}

export async function getHome(day: string | null = null): Promise<HomeSections> {
  const currentDay = day ? day.toUpperCase() : "KAMIS";
  const res = await proxyGet<{ data?: Record<string, RawAnimeItem[]> }>(
    `/3/2/home/data?day=${encodeURIComponent(currentDay)}&limit=20`,
  );
  const data = res.data ?? {};
  const map = (key: string) => (data[key] ?? []).map(mapAnimeSummary).filter(Boolean) as AnimeSummary[];

  return {
    today: map("today"),
    popular: map("popular"),
    new: map("new"),
    hot: map("hot"),
    slider: map("slider"),
    waiting: map("waiting"),
  };
}

async function explore(params: string, page: number): Promise<ListResult> {
  const p = Math.max(0, page);
  const res = await proxyGet<{ data?: { movie?: RawAnimeItem[] } }>(
    `/3/2/explore/movie?page=${p}${params}`,
  );
  const movies = res.data?.movie ?? [];
  const items = movies.map(mapAnimeSummary).filter(Boolean) as AnimeSummary[];
  return { items, page, hasNext: items.length > 0 };
}

export function search(keyword: string, page = 0): Promise<ListResult> {
  if (!keyword.trim()) return Promise.resolve({ items: [], page, hasNext: false });
  return explore(`&sort=views&keyword=${encodeURIComponent(keyword)}`, page);
}

export function getLatest(page = 0): Promise<ListResult> {
  return explore("&sort=latest&keyword=", page);
}

export function getPopular(page = 0): Promise<ListResult> {
  return explore("&sort=views&keyword=", page);
}

export async function getGenres(): Promise<GenreItem[]> {
  const res = await proxyGet<{ data?: { genre?: RawAnimeItem[] } }>("/3/2/explore/genre");
  const genres = res.data?.genre ?? [];
  return genres.map((g) => ({
    id: String(g["id"] ?? ""),
    name: String(g["name"] ?? ""),
    group: (g["group"] as string) ?? null,
    image: (g["image"] as string) ?? null,
  }));
}

export function getByGenre(genreId: string, page = 0, sort = "views"): Promise<ListResult> {
  return explore(`&sort=${encodeURIComponent(sort)}&id_genre=${encodeURIComponent(genreId)}`, page);
}

export async function getSchedule(): Promise<ScheduleMap> {
  const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
  const entries = await Promise.all(
    days.map(async (day) => {
      try {
        const res = await proxyGet<{ data?: { today?: RawAnimeItem[] } }>(
          `/3/2/home/data?day=${encodeURIComponent(day)}&limit=50`,
        );
        const items = (res.data?.today ?? []).map(mapAnimeSummary).filter(Boolean) as AnimeSummary[];
        return [day, items] as const;
      } catch {
        return [day, [] as AnimeSummary[]] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export async function getEpisodes(animeIdOrUrl: string): Promise<EpisodeSummary[]> {
  const id = cleanId(animeIdOrUrl);
  if (!id) return [];
  const res = await proxyGet<{ data?: { episode?: RawAnimeItem[] } }>(
    `/3/2/movie/episode/${encodeURIComponent(id)}?page=0`,
  );
  const eps = res.data?.episode ?? [];
  return eps.map(mapEpisode);
}

export async function getDetail(animeIdOrUrl: string): Promise<AnimeDetail> {
  const id = cleanId(animeIdOrUrl);
  if (!id) throw new Error("ID anime tidak valid.");

  const res = await proxyGet<{ data?: { movie?: RawAnimeItem } }>(
    `/3/2/movie/detail/${encodeURIComponent(id)}`,
  );
  const movie = res.data?.movie;
  if (!movie) throw new Error("Anime tidak ditemukan.");

  const summary = mapAnimeSummary(movie);
  if (!summary) throw new Error("Anime tidak ditemukan.");

  const episodes = await getEpisodes(id);

  return {
    ...summary,
    studio: (movie["studio"] as string) ?? "-",
    airedEnd: (movie["aired_end"] as string) ?? null,
    totalEpisodes: episodes.length,
    episodes,
  };
}

export async function getStream(episodeIdOrUrl: string): Promise<StreamResult> {
  const epId = cleanId(episodeIdOrUrl);
  if (!epId) throw new Error("ID episode tidak valid.");

  const res = await proxyGet<{ data?: Record<string, unknown> }>(
    `/3/2/episode/streamnew/${encodeURIComponent(epId)}`,
  );
  const d = res.data ?? {};
  const episodeInfo = (d["episode"] as RawAnimeItem) ?? {};
  const nextEpisode = (d["episode_next"] as RawAnimeItem) ?? null;
  const servers = ((d["server"] as RawAnimeItem[]) ?? []).map((s) => ({
    id: String(s["id"] ?? ""),
    name: String(s["name"] ?? ""),
    quality: String(s["quality"] ?? ""),
    type: (s["type"] as string) ?? null,
    fileSizeMb: toNumber(s["key_file_size"]),
    url: String(s["link"] ?? ""),
    serverId: String(s["server_id"] ?? s["id"] ?? ""),
  }));

  return {
    episode: {
      id: String(episodeInfo["id"] ?? epId),
      title: String(episodeInfo["title"] ?? ""),
      number: Number(episodeInfo["index"] ?? 0),
      views: toNumber(episodeInfo["views"]) ?? 0,
      releaseDate: (episodeInfo["key_time"] as string) ?? null,
      nextEpisodeId: nextEpisode ? String(nextEpisode["id"] ?? "") : null,
    },
    servers,
  };
}
