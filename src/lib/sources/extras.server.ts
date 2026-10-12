import * as cheerio from "cheerio";
import { cached } from "./cache.server";
import { absUrl, cleanText, fetchJson, request } from "./http.server";
import { normalizeTitle } from "./ids";

/**
 * Fitur tambahan yang diadaptasi dari proyek hianime-api:
 * karakter dan pengisi suara, hitung mundur episode berikutnya, berita anime, dan top search.
 * Semuanya hanya pelengkap: kalau sumber gagal, hasilnya kosong dan halaman tetap jalan.
 */

const SOURCE = "extras";
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/**
 * Alamat sumber fitur tambahan hanya dibaca dari environment (EXTRAS_URL), tidak ada alamat
 * bawaan di kode. Kalau kosong, semua fitur tambahan mati dan halaman tetap berjalan normal.
 */
function baseUrl(): string {
  return (process.env["EXTRAS_URL"] || "").trim().replace(/\/+$/, "");
}
function cdnUrl(): string {
  return (process.env["EXTRAS_CDN_URL"] || "https://cdnanimo.xyz").trim().replace(/\/+$/, "");
}
function extrasEnabled(): boolean {
  return /^https?:\/\//i.test(baseUrl());
}

function httpsOnly(url: string | null | undefined): string {
  const value = (url ?? "").trim();
  return /^https?:\/\//i.test(value) ? value : "";
}

/* ----------------------------- Sesi + AJAX ----------------------------- */

interface Session {
  token: string;
  cookie: string;
}

async function bootstrapSession(): Promise<Session> {
  const base = baseUrl();
  const res = await request(`${base}/home`, {
    source: SOURCE,
    timeoutMs: 12000,
    headers: { Accept: "text/html,application/xhtml+xml", Referer: `${base}/home` },
  });
  const html = await res.text();
  const token = html.match(/window\.AJAX_TOKEN\s*=\s*"([^"]+)"/)?.[1];
  if (!token) throw new Error("[extras] token halaman tidak ditemukan");
  const setCookies =
    (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  const cookie = setCookies
    .map((c) => c.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
  return { token, cookie };
}

async function ajax<T>(path: string): Promise<T> {
  const base = baseUrl();
  const session = await cached(`${SOURCE}:session`, 5 * MIN, bootstrapSession);
  return fetchJson<T>(`${base}${path}`, {
    source: SOURCE,
    timeoutMs: 12000,
    headers: {
      Referer: `${base}/home`,
      "X-Requested-With": "XMLHttpRequest",
      "X-Page-Token": session.token,
      ...(session.cookie ? { Cookie: session.cookie } : {}),
    },
  });
}

/* --------------------------- Pencocokan judul → id --------------------------- */

interface SearchJson {
  response?: {
    id?: string | number;
    slug?: string;
    title?: string;
    alternativeTitle?: string;
    titles?: { romaji?: string; english?: string; native?: string };
  }[];
}

function numericId(slug: string | undefined, id: string | number | undefined): string | null {
  const fromSlug = slug?.split("-").at(-1);
  if (fromSlug && /^\d+$/.test(fromSlug)) return fromSlug;
  if (id !== undefined && /^\d+$/.test(String(id))) return String(id);
  return null;
}

async function findAnimeId(title: string): Promise<string | null> {
  const key = normalizeTitle(title);
  if (!key) return null;
  return cached(`${SOURCE}:id:${key}`, 6 * HOUR, async () => {
    const keyword = encodeURIComponent(title.trim()).replace(/%20/g, "+");
    const json = await ajax<SearchJson>(`/ajax/search?keyword=${keyword}`);
    const items = Array.isArray(json.response) ? json.response : [];
    const names = (it: (typeof items)[number]) =>
      [it.title, it.alternativeTitle, it.titles?.english, it.titles?.romaji, it.titles?.native]
        .filter((n): n is string => Boolean(n))
        .map(normalizeTitle);
    const exact = items.find((it) => names(it).includes(key));
    // Tanpa kecocokan persis lebih baik kosong daripada menampilkan anime yang salah.
    return exact ? numericId(exact.slug, exact.id) : null;
  });
}

/* ------------------------------ Episode berikutnya ------------------------------ */

export interface NextEpisodeInfo {
  episode: number;
  airingAt: string | null;
  secondsUntil: number | null;
  fetchedAt: number;
}

export async function getNextEpisode(title: string): Promise<NextEpisodeInfo | null> {
  if (!extrasEnabled()) return null;
  try {
    const id = await findAnimeId(title);
    if (!id) return null;
    return await cached(`${SOURCE}:next:${id}`, 5 * MIN, async () => {
      const json = await ajax<{
        episode?: number;
        airing_at_iso?: string;
        timeUntilAiring?: number;
      }>(`/ajax/schedule?animeId=${encodeURIComponent(id)}`);
      if (typeof json.episode !== "number") return null;
      return {
        episode: json.episode,
        airingAt: json.airing_at_iso || null,
        secondsUntil: typeof json.timeUntilAiring === "number" ? json.timeUntilAiring : null,
        fetchedAt: Date.now(),
      };
    });
  } catch (err) {
    console.warn("[extras] episode berikutnya gagal:", err instanceof Error ? err.message : err);
    return null;
  }
}

/* ------------------------------ Karakter + CV ------------------------------ */

export interface VoiceActorInfo {
  name: string;
  language: string;
  image: string;
}
export interface CharacterInfo {
  name: string;
  role: string;
  image: string;
  voiceActors: VoiceActorInfo[];
}

type NameField = string | { full?: string; native?: string } | undefined;
type ImageField = string | { jpg?: string } | undefined;

const nameOf = (n: NameField): string => (typeof n === "string" ? n : (n?.full ?? ""));
const imageOf = (i: ImageField): string => httpsOnly(typeof i === "string" ? i : i?.jpg);

interface CharactersJson {
  data?: {
    name?: NameField;
    image?: ImageField;
    role?: string;
    voice_actors?: { name?: NameField; image?: ImageField; language?: string; cast?: string }[];
  }[];
}

export async function getCharacters(title: string): Promise<CharacterInfo[]> {
  if (!extrasEnabled()) return [];
  try {
    const id = await findAnimeId(title);
    if (!id) return [];
    return await cached(`${SOURCE}:chars:${id}`, 6 * HOUR, async () => {
      const json = await fetchJson<CharactersJson>(
        `${cdnUrl()}/anime/${encodeURIComponent(id)}/characters`,
        {
          source: SOURCE,
          timeoutMs: 12000,
        },
      );
      return (Array.isArray(json.data) ? json.data : [])
        .map((c): CharacterInfo => ({
          name: nameOf(c.name),
          role: c.role ?? "",
          image: imageOf(c.image),
          voiceActors: (c.voice_actors ?? [])
            .map((v) => ({
              name: nameOf(v.name),
              language: v.language || v.cast || "",
              image: imageOf(v.image),
            }))
            .filter((v) => v.name),
        }))
        .filter((c) => c.name)
        .slice(0, 24);
    });
  } catch (err) {
    console.warn("[extras] karakter gagal:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* --------------------------------- Berita --------------------------------- */

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  postedAt: string;
}

export async function getNews(page = 1): Promise<NewsItem[]> {
  if (!extrasEnabled()) return [];
  try {
    return await cached(`${SOURCE}:news:${page}`, 15 * MIN, async () => {
      const base = baseUrl();
      const html = await (
        await request(page > 1 ? `${base}/news?page=${page}` : `${base}/news`, {
          source: SOURCE,
          timeoutMs: 12000,
        })
      ).text();
      const $ = cheerio.load(html);
      const items: NewsItem[] = [];
      $(".zr-news-list .item").each((_, el) => {
        const node = $(el);
        const title = cleanText(node.find(".news-title").text());
        const url = httpsOnly(absUrl(base, node.find(".zrn-title").attr("href")));
        if (!title || !url) return;
        const img = node.find(".zrn-image");
        items.push({
          id: url.split("/").filter(Boolean).pop() ?? url,
          title,
          description: cleanText(node.find(".description").text()).slice(0, 280),
          thumbnail: httpsOnly(absUrl(base, img.attr("src") || img.attr("data-src"))),
          url,
          postedAt: cleanText(node.find(".time-posted").text()),
        });
      });
      return items;
    });
  } catch (err) {
    console.warn("[extras] berita gagal:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* -------------------------------- Top search -------------------------------- */

export async function getTopSearch(): Promise<string[]> {
  if (!extrasEnabled()) return [];
  try {
    return await cached(`${SOURCE}:top-search`, 30 * MIN, async () => {
      const html = await (
        await request(`${baseUrl()}/`, { source: SOURCE, timeoutMs: 12000 })
      ).text();
      const $ = cheerio.load(html);
      const seen = new Set<string>();
      const out: string[] = [];
      $(".xhashtag .item").each((_, el) => {
        const text = cleanText($(el).text());
        const key = text.toLowerCase();
        if (text && text.length <= 60 && !seen.has(key)) {
          seen.add(key);
          out.push(text);
        }
      });
      return out.slice(0, 12);
    });
  } catch (err) {
    console.warn("[extras] top search gagal:", err instanceof Error ? err.message : err);
    return [];
  }
}
