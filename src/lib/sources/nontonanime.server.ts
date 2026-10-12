import * as cheerio from "cheerio";
import type { DownloadQualityGroup, DownloadUrlItem } from "../anime-types";
import {
  absUrl,
  cleanText,
  fetchJson,
  fetchText,
  isDirectMediaUrl,
  lastSegment,
  parseNumber,
} from "./http.server";
import { formatScore, makeItem, toAnimeId, toEpisodeId } from "./ids";
import { assertPublicHttpUrl } from "./token.server";
import type {
  AnimeSource,
  SourceDetail,
  SourceEpisode,
  SourceItem,
  SourcePage,
  SourceServer,
  SourceStream,
} from "./types";

const SOURCE = "nontonanime";
const DEFAULT_BASE = "https://nontonanime.id";
const SERVER_SLOTS = 3;
const DOWNLOAD_SLOTS = 6;
const MAX_SYNTHETIC_EPISODES = 2000;

type RawEpisode = Record<string, unknown>;

interface LiveSearchItem {
  slug?: string;
  title?: string;
  name?: string;
  poster?: string;
  image?: string;
  thumbnail?: string;
  cover?: string;
  type?: string;
  status?: string;
  rating?: string | number;
  year?: string | number;
}

interface LiveSearchResponse {
  data?: LiveSearchItem[];
}

function baseUrl(): string {
  return DEFAULT_BASE;
}

function siteReferer(): string {
  return `${baseUrl()}/`;
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const found = text(value);
    if (found) return found;
  }
  return null;
}

function humanize(slug: string): string {
  return slug.replace(/-+/g, " ").replace(/\s+/g, " ").trim();
}

async function html(url: string, referer?: string): Promise<string> {
  return fetchText(url, {
    source: SOURCE,
    headers: {
      Accept: "text/html,application/xhtml+xml,*/*",
      Referer: referer ?? siteReferer(),
    },
  });
}

function streamProxyUrl(target: string): string {
  return `/api/stream-proxy?url=${encodeURIComponent(target)}&ref=${encodeURIComponent(siteReferer())}`;
}

function embedProxyUrl(target: string): string {
  return `/api/embed-proxy?url=${encodeURIComponent(target)}&ref=${encodeURIComponent(siteReferer())}`;
}

export function decodeStreamUrl(embedUrl: string): string | null {
  try {
    const parsed = new URL(embedUrl.replace(/&amp;/g, "&"), baseUrl());
    let link = parsed.searchParams.get("link");
    if (link) {
      link = decodeURIComponent(link.replace(/ /g, "+"));
      if (link.includes("%")) {
        try {
          link = decodeURIComponent(link);
        } catch {
          // ignore URI malformed
        }
      }
      const decoded = Buffer.from(link, "base64").toString("utf8").trim();
      if (/^https?:\/\//i.test(decoded)) return decoded;
    }

    const streamMatch = parsed.pathname.match(/\/stream(?:\/v\d+)?\/([a-zA-Z0-9+/=_-]+)/);
    if (streamMatch && streamMatch[1]) {
      const b64 = streamMatch[1].replace(/-/g, "+").replace(/_/g, "/");
      let decoded = "";
      try {
        decoded = Buffer.from(b64, "base64").toString("utf8").trim();
      } catch {
        // ignore base64 decode failure
      }
      if (/^https?:\/\//i.test(decoded)) {
        const search = parsed.search;
        return search
          ? `${decoded}${decoded.includes("?") ? "&" : "?"}${search.slice(1)}`
          : decoded;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function isPublicUrl(url: string): boolean {
  try {
    assertPublicHttpUrl(url);
    return true;
  } catch {
    return false;
  }
}

function extractAllEpisodes(source: string): RawEpisode[] {
  const marker = source.search(/allEpisodes\s*=\s*\[/);
  if (marker === -1) return [];
  const start = source.indexOf("[", marker);
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let i = start; i < source.length; i++) {
    const ch = source.charAt(i);
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "[") depth++;
    if (ch !== "]") continue;
    depth--;
    if (depth !== 0) continue;
    try {
      const parsed: unknown = JSON.parse(source.slice(start, i + 1));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (entry): entry is RawEpisode => typeof entry === "object" && entry !== null,
      );
    } catch {
      return [];
    }
  }
  return [];
}

function buildServers(episode: RawEpisode): SourceServer[] {
  const direct: SourceServer[] = [];
  const bypass: SourceServer[] = [];
  const seen = new Set<string>();

  const add = (list: SourceServer[], name: string, url: string, quality = "720p HD") => {
    if (seen.has(url)) return;
    seen.add(url);
    list.push({ name, quality, ref: { kind: "url", url } });
  };

  for (let slot = 1; slot <= SERVER_SLOTS; slot++) {
    const rawEmbed = text(episode[slot === 1 ? "video_url" : `video_url${slot}`]);
    if (!rawEmbed) continue;
    const label = text(episode[`server${slot}_name`]) || `Server ${slot}`;
    const embedUrl = absUrl(baseUrl(), rawEmbed.replace(/&amp;/g, "&"));
    const decoded = decodeStreamUrl(embedUrl);
    const quality = label.includes("1080")
      ? "1080p FHD"
      : label.includes("720") || label.includes("HD")
        ? "720p HD"
        : "Auto";

    if (decoded && isPublicUrl(decoded)) {
      if (isDirectMediaUrl(decoded))
        add(direct, `NontonAnime ${label} (Direct)`, streamProxyUrl(decoded), quality);
      else add(direct, `NontonAnime ${label} (Embed)`, embedProxyUrl(decoded), quality);
    }
    if (isPublicUrl(embedUrl))
      add(bypass, `NontonAnime ${label} (Bypass Embed)`, embedProxyUrl(embedUrl), quality);
  }

  return [...direct, ...bypass];
}

function buildDownloads(episode: RawEpisode): DownloadQualityGroup[] {
  const urls: DownloadUrlItem[] = [];
  for (let slot = 1; slot <= DOWNLOAD_SLOTS; slot++) {
    const url = text(episode[`download_url_${slot}`]);
    if (!url) continue;
    urls.push({
      title: text(episode[`download_label_${slot}`]) || `Unduh ${slot}`,
      url: absUrl(baseUrl(), url),
    });
  }
  return urls.length > 0 ? [{ quality: "Unduhan", size: null, urls }] : [];
}

function splitEpisodeSlug(slug: string): { animeSlug: string; number: number } | null {
  const match = slug.match(/^(.+)-episode-(\d+(?:\.\d+)?)$/i);
  if (!match?.[1] || !match[2]) return null;
  return { animeSlug: match[1], number: parseFloat(match[2]) };
}

function stripScripts(source: string): string {
  return source.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
}

function labeled(source: string, pattern: RegExp): string | null {
  const value = source.match(pattern)?.[1];
  return value ? cleanText(value) : null;
}

function parseGenres(source: string): string[] {
  const block = source.match(/Genres?[\s\S]*?<\/div>/)?.[0];
  if (!block) return [];
  const names = [...block.matchAll(/>([A-Za-z][A-Za-z ]{2,30})</g)]
    .map((m) => cleanText(m[1]))
    .filter((name) => name && !/^Genres?$/i.test(name));
  return [...new Set(names)];
}

function mapSearchItem(entry: LiveSearchItem): SourceItem | null {
  const slug = text(entry.slug);
  if (!slug) return null;
  const poster = firstText(entry.poster, entry.image, entry.thumbnail, entry.cover);
  return makeItem(SOURCE, slug, {
    title: firstText(entry.title, entry.name) ?? humanize(slug),
    poster: poster ? absUrl(baseUrl(), poster) : null,
    type: firstText(entry.type),
    status: firstText(entry.status),
    score: entry.rating ?? null,
    year: firstText(entry.year),
  });
}

export const nontonanime: AnimeSource = {
  id: SOURCE,
  label: "NontonAnime",

  async search(keyword, page): Promise<SourcePage> {
    if (page > 1) return { items: [], hasNext: false };
    const term = keyword.trim();
    const response = await fetchJson<LiveSearchResponse>(
      `${baseUrl()}/live-search?q=${encodeURIComponent(term)}`,
      { source: SOURCE, headers: { Referer: siteReferer() } },
    );
    let rawList = response.data ?? [];

    if (rawList.length === 0) {
      const cleaned = term
        .replace(/[△▲★☆]/g, " ")
        .replace(/\s+(?:the\s+)?movie\b/gi, "")
        .replace(/\s+(?:season|s)\s*\d+/gi, "")
        .replace(/\s+(?:sub|dub|ova|special).*/gi, "")
        .trim();
      if (cleaned && cleaned.toLowerCase() !== term.toLowerCase()) {
        const fbResponse = await fetchJson<LiveSearchResponse>(
          `${baseUrl()}/live-search?q=${encodeURIComponent(cleaned)}`,
          { source: SOURCE, headers: { Referer: siteReferer() } },
        );
        if (fbResponse.data?.length) {
          rawList = fbResponse.data;
        }
      }
    }

    const isMovieQuery = /movie/i.test(term);
    if (isMovieQuery && rawList.length > 0) {
      rawList.sort((a, b) => {
        const aMovie = /movie/i.test(`${a.title || ""} ${a.slug || ""}`);
        const bMovie = /movie/i.test(`${b.title || ""} ${b.slug || ""}`);
        if (aMovie && !bMovie) return -1;
        if (!aMovie && bMovie) return 1;
        return 0;
      });
    }

    const items = rawList.map(mapSearchItem).filter((item): item is SourceItem => item !== null);
    return { items, hasNext: false };
  },

  async getDetail(slug) {
    const clean = lastSegment(slug);
    const source = await html(`${baseUrl()}/anime/${clean}`);
    const $ = cheerio.load(source);
    const body = stripScripts(source);

    const title = cleanText($("h1").first().text()) || humanize(clean);
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    const posterAttr =
      $('img[class*="poster"], img[class*="wp-post-image"], img[class*="attachment"]')
        .first()
        .attr("src") ||
      $('img[class*="poster"], img[class*="wp-post-image"], img[class*="attachment"]')
        .first()
        .attr("data-src") ||
      ogImage;
    const poster = posterAttr ? absUrl(baseUrl(), posterAttr) : null;
    const cover = ogImage ? absUrl(baseUrl(), ogImage) : poster;

    const synopsis =
      cleanText(
        $('div[class*="entry-content"], div[class*="synopsis"], div[class*="description"]')
          .first()
          .text(),
      ) ||
      cleanText($('meta[property="og:description"]').attr("content")) ||
      null;

    const aired = labeled(body, /\bAired\b[\s\S]*?<[^>]*>([^<]+)</);
    const year = aired?.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? null;
    const statusMatch = body.match(/\b(Completed|Ongoing|Hiatus)\b/i)?.[1];
    const total = parseNumber(labeled(body, /\bEpisode\b[\s\S]*?<[^>]*>(\d+)</));

    const episodes: SourceEpisode[] = [];
    const seen = new Set<string>();
    $('a[href*="-episode-"]').each((_, el) => {
      const epSlug = lastSegment($(el).attr("href"));
      const parts = splitEpisodeSlug(epSlug);
      if (!parts || parts.animeSlug !== clean || seen.has(epSlug)) return;
      seen.add(epSlug);
      let epTitle = cleanText($(el).text());
      if (!epTitle || /^(watch|nonton|play|tonton|stream)$/i.test(epTitle)) {
        epTitle = clean.toLowerCase().includes("movie") ? "Movie" : `Episode ${parts.number}`;
      }
      episodes.push({
        id: toEpisodeId(SOURCE, epSlug),
        number: parts.number,
        title: epTitle,
        date: null,
      });
    });

    if (episodes.length === 0) {
      const count = total && total >= 1 && total <= MAX_SYNTHETIC_EPISODES ? Math.floor(total) : 1;
      for (let number = 1; number <= count; number++) {
        episodes.push({
          id: toEpisodeId(SOURCE, `${clean}-episode-${number}`),
          number,
          title: `Episode ${number}`,
          date: null,
        });
      }
    }
    episodes.sort((a, b) => a.number - b.number);

    const detail: SourceDetail = {
      id: toAnimeId(SOURCE, clean),
      source: SOURCE,
      title,
      japanese: labeled(body, /Japanese Title[\s\S]*?<[^>]+>([^<]+)</i),
      poster,
      cover,
      synopsis,
      status: statusMatch
        ? statusMatch.charAt(0).toUpperCase() + statusMatch.slice(1).toLowerCase()
        : null,
      type: labeled(body, /\bType\b[\s\S]*?<[^>]*>([A-Z]+)</),
      score: formatScore(labeled(body, /\bRating\b[\s\S]*?<[^>]*>([\d.]+)/)),
      genres: parseGenres(body),
      studio: labeled(body, /\bStudio\b[\s\S]*?<[^>]*>([^<]+)</),
      producers: null,
      duration: null,
      aired,
      year,
      episodes,
      recommended: [],
    };
    return detail;
  },

  async getStream(slug) {
    const clean = lastSegment(slug);
    const parts = splitEpisodeSlug(clean);
    const animeSlug = parts?.animeSlug ?? clean.replace(/-episode-.*$/i, "");
    const number = parts?.number ?? 1;

    const source = await html(`${baseUrl()}/${clean}`, `${baseUrl()}/anime/${animeSlug}`);
    const $ = cheerio.load(source);

    const all = extractAllEpisodes(source);
    const current =
      all.find((entry) => parseNumber(entry["episode_number"]) === number) ?? all[0] ?? null;

    const heading = cleanText($("h1").first().text()) || humanize(animeSlug);
    const title = /episode\s*\d+/i.test(heading) ? heading : `${heading} Episode ${number}`;

    const numbers = all
      .map((entry) => parseNumber(entry["episode_number"]))
      .filter((value): value is number => value !== null && Number.isInteger(value));
    const before = numbers.filter((value) => value < number);
    const after = numbers.filter((value) => value > number);
    const prev = before.length > 0 ? Math.max(...before) : null;
    const next = after.length > 0 ? Math.min(...after) : null;

    const stream: SourceStream = {
      id: toEpisodeId(SOURCE, clean),
      animeId: toAnimeId(SOURCE, animeSlug),
      title,
      releaseTime: current ? firstText(current["air_date"]) : null,
      servers: current ? buildServers(current) : [],
      downloads: current ? buildDownloads(current) : [],
      prevEpisodeId: prev !== null ? toEpisodeId(SOURCE, `${animeSlug}-episode-${prev}`) : null,
      nextEpisodeId: next !== null ? toEpisodeId(SOURCE, `${animeSlug}-episode-${next}`) : null,
    };
    return stream;
  },
};
