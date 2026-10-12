import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { DownloadQualityGroup } from "../anime-types";
import { cached } from "./cache.server";
import { absUrl, cleanText, fetchJson, fetchText, slugify } from "./http.server";
import { makeItem, toAnimeId, toEpisodeId } from "./ids";
import { formatSafePoster } from "./poster.server";
import {
  associateProvider,
  isProviderActive,
  type AssociatedProviderLink,
  type ScrapedLink,
} from "./providers";
import type {
  AnimeSource,
  HomeFeed,
  SourceDetail,
  SourceEpisode,
  SourceGenre,
  SourceItem,
  SourcePage,
  SourceServer,
  SourceStream,
} from "./types";

const BASE_URL = "https://nimegami.id";

interface NimegamiSearchResponse {
  suggestions?: Array<{
    slug: string;
    title: string;
    poster?: string | null;
    format?: string | null;
    year?: number | string | null;
  }>;
}

export type NimegamiRawLink = ScrapedLink;

interface NimegamiWatchPanel {
  title?: string;
  banner?: string | null;
  slug?: string;
  movie?: boolean;
  episodeInfo?: Array<{ number: number; title: string }>;
  links?: NimegamiRawLink[];
}

interface NimegamiJsonLdWork {
  "@type"?: string;
  name?: string;
  alternateName?: string[] | string;
  description?: string;
  genre?: string[];
  image?: string;
  numberOfEpisodes?: number;
}

function cleanNimegamiPoster(raw: string | null | undefined, title?: string): string {
  if (!raw) {
    return title ? formatSafePoster(null, title) : "";
  }
  let url = raw;
  if (url.includes("url=")) {
    try {
      const match = url.match(/url=([^&]+)/);
      if (match?.[1]) {
        url = decodeURIComponent(match[1]);
      }
    } catch {
      // keep url as is
    }
  }
  const absolute = absUrl(BASE_URL, url);
  return formatSafePoster(absolute, title);
}

function parseCards($: CheerioAPI): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();

  $("article.anime-card, .best-anime-card, .anime-card").each((_, el) => {
    const card = $(el);
    const link = card.find("a.poster-link, a.best-anime-card").addBack("a.best-anime-card").first();
    const href = link.attr("href") || card.find("a").first().attr("href") || "";
    const slug = href.replace(/^\/|\/$/g, "");
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const img = card.find("img").first();
    const rawPoster = img.attr("src") || img.attr("data-src") || "";
    const title =
      cleanText(card.find("h2, .card-title").first().text()) || cleanText(img.attr("alt")) || "";

    if (!title || title.length <= 1) return;

    const cardText = card.text().toLowerCase();
    let status: string | null = null;
    if (cardText.includes("tamat") || cardText.includes("completed")) {
      status = "Completed";
    } else if (cardText.includes("ongoing") || cardText.includes("tayang")) {
      status = "Ongoing";
    }

    let type = "TV";
    const lowerTitle = title.toLowerCase();
    const lowerSlug = slug.toLowerCase();
    if (
      lowerTitle.includes("season") ||
      lowerSlug.includes("season") ||
      cardText.includes("episode") ||
      cardText.includes("eps")
    ) {
      type = "TV";
    } else if (
      cardText.includes("movie") ||
      lowerTitle.includes("movie") ||
      lowerSlug.includes("movie")
    ) {
      type = "Movie";
    } else if (
      cardText.includes("ova") ||
      lowerTitle.includes("ova") ||
      lowerSlug.includes("ova")
    ) {
      type = "OVA";
    }

    items.push(
      makeItem("nimegami", slug, {
        title,
        poster: cleanNimegamiPoster(rawPoster, title),
        type,
        status,
      }),
    );
  });

  return items;
}

export interface RawDetailBundle {
  title: string;
  japanese: string | null;
  poster: string | null;
  cover: string | null;
  synopsis: string | null;
  status: string;
  type: string;
  score: string | null;
  genres: string[];
  episodes: SourceEpisode[];
  recommended: SourceItem[];
  links: AssociatedProviderLink[];
  episodeInfo: Array<{ number: number; title: string }>;
}

/**
 * Direct parser to extract anime detail and associate active streaming providers from scraped text.
 */
export function extractAnimeDetail(text: string, slug: string): RawDetailBundle {
  // 1. JSON-LD Parser with balanced braces
  let jsonLdWork: NimegamiJsonLdWork | null = null;
  const jsonLdStart = text.indexOf('{"@context":"https://schema.org"');
  if (jsonLdStart !== -1) {
    let depth = 0;
    let jsonLdEnd = jsonLdStart;
    for (let i = jsonLdStart; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          jsonLdEnd = i;
          break;
        }
      }
    }
    try {
      const parsed = JSON.parse(text.slice(jsonLdStart, jsonLdEnd + 1));
      const graph = (parsed["@graph"] as unknown[]) || [];
      jsonLdWork =
        (graph.find((x: unknown) => {
          if (!x || typeof x !== "object") return false;
          const type = (x as Record<string, unknown>)["@type"];
          return (
            type === "TVSeries" ||
            type === "Movie" ||
            type === "CreativeWorkSeries" ||
            type === "Episode"
          );
        }) as NimegamiJsonLdWork) || null;
    } catch {
      // ignore json-ld parse error
    }
  }

  // 2. WatchPanel Links & EpisodeInfo parser with balanced braces
  let watchPanel: NimegamiWatchPanel | null = null;
  const linksStart = text.indexOf('{"links":[');
  if (linksStart !== -1) {
    let depth = 0;
    let linksEnd = linksStart;
    for (let i = linksStart; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          linksEnd = i;
          break;
        }
      }
    }
    try {
      watchPanel = JSON.parse(text.slice(linksStart, linksEnd + 1)) as NimegamiWatchPanel;
    } catch {
      // ignore watch-panel parse error
    }
  }

  // 3. Fallback title, alternateName, synopsis
  const title = cleanText(watchPanel?.title || jsonLdWork?.name || slug.replace(/[-_]+/g, " "));
  const rawAlt = jsonLdWork?.alternateName;
  const japanese = Array.isArray(rawAlt)
    ? (rawAlt[0] ?? null)
    : typeof rawAlt === "string"
      ? rawAlt
      : null;
  const synopsis = cleanText(jsonLdWork?.description || null);
  const poster = cleanNimegamiPoster(jsonLdWork?.image || watchPanel?.banner || null, title);
  const cover = cleanNimegamiPoster(watchPanel?.banner || jsonLdWork?.image || null, title);
  const genres = jsonLdWork?.genre ?? [];

  // Parse episode list
  const episodeInfo = watchPanel?.episodeInfo || [];
  const rawLinks = (watchPanel?.links || []) as ScrapedLink[];

  // Parse and associate specific streaming providers from scraped links & verify if active
  const associatedLinks: AssociatedProviderLink[] = rawLinks.map((l) => associateProvider(l));
  const activeLinks = associatedLinks.filter((l) => isProviderActive(l));
  const links = activeLinks;

  const episodes: SourceEpisode[] = [];
  const seenEpNumbers = new Set<number>();

  if (episodeInfo.length > 0) {
    for (const ep of episodeInfo) {
      if (!seenEpNumbers.has(ep.number)) {
        seenEpNumbers.add(ep.number);
        episodes.push({
          id: toEpisodeId("nimegami", `${slug}-ep-${ep.number}`),
          number: ep.number,
          title: ep.title || `Episode ${ep.number}`,
          date: null,
        });
      }
    }
  } else {
    // Collect distinct episode numbers from links
    const distinctEpisodes = Array.from(
      new Set(
        links.map((l) => l.episode).filter((n): n is number => typeof n === "number" && n > 0),
      ),
    ).sort((a, b) => a - b);

    for (const num of distinctEpisodes) {
      episodes.push({
        id: toEpisodeId("nimegami", `${slug}-ep-${num}`),
        number: num,
        title: `Episode ${num}`,
        date: null,
      });
    }
  }

  if (episodes.length === 0) {
    episodes.push({
      id: toEpisodeId("nimegami", `${slug}-ep-1`),
      number: 1,
      title: "Episode 1",
      date: null,
    });
  }

  // Extract recommendations from raw text
  const recommended: SourceItem[] = [];
  const seenRec = new Set<string>();
  const recRegex =
    /"href":"\/([a-z0-9_-]+)\/","prefetch":false,"className":"poster-link"[^}]*"src":"([^"]+)"[^}]*"alt":"([^"]+)"/g;

  for (const m of text.matchAll(recRegex)) {
    const recSlug = m[1];
    const recPoster = m[2];
    const recTitle = cleanText(m[3]);
    if (recSlug && recTitle && recSlug !== slug && !seenRec.has(recSlug)) {
      seenRec.add(recSlug);
      recommended.push(
        makeItem("nimegami", recSlug, {
          title: recTitle,
          poster: cleanNimegamiPoster(recPoster, recTitle),
          type: "TV",
        }),
      );
    }
  }

  // Status & Type
  let status = "Completed";
  if (text.includes('"status-dot"') && text.toLowerCase().includes("ongoing")) {
    status = "Ongoing";
  }

  let type = "TV";
  const jsonLdType = (jsonLdWork as Record<string, unknown> | null)?.["@type"];
  const lowerTitle = title.toLowerCase();
  const lowerSlug = slug.toLowerCase();

  if (episodes.length > 1 || lowerTitle.includes("season") || lowerSlug.includes("season")) {
    type = "TV";
  } else if (jsonLdType === "Movie" || watchPanel?.movie) {
    type = "Movie";
  } else if (jsonLdType === "TVSeries" || jsonLdType === "CreativeWorkSeries") {
    type = "TV";
  } else if (
    lowerSlug.includes("ova") ||
    lowerTitle.includes("ova") ||
    lowerSlug.includes("special")
  ) {
    type = "OVA";
  } else if (
    (lowerSlug.includes("movie") || lowerTitle.includes("movie") || lowerSlug.includes("film")) &&
    episodes.length <= 1
  ) {
    type = "Movie";
  }

  // Score
  let score: string | null = null;
  const scoreMatch =
    text.match(/"className":"detail-score"[^>]*?>([0-9.]+)/i) ||
    text.match(/"detail-score"[^}]*?"([0-9.]+)"/);
  if (scoreMatch?.[1]) {
    score = scoreMatch[1];
  }

  return {
    title,
    japanese,
    poster,
    cover,
    synopsis,
    status,
    type,
    score,
    genres,
    episodes,
    recommended,
    links,
    episodeInfo,
  };
}

async function loadRawDetail(slug: string): Promise<RawDetailBundle> {
  const url = `${BASE_URL}/${slug}/`;
  const text = await fetchText(url, {
    source: "nimegami",
    headers: {
      rsc: "1",
      "next-router-prefetch": "1",
      accept: "*/*",
      Referer: `${BASE_URL}/`,
    },
    timeoutMs: 12000,
  });

  return extractAnimeDetail(text, slug);
}

export const nimegami: AnimeSource = {
  id: "nimegami",
  label: "Nimegami",

  async getHome() {
    const [latestRes, popRes] = await Promise.all([
      nimegami.getLatest?.(1).catch(() => ({ items: [], hasNext: false })),
      nimegami.getPopular?.(1).catch(() => ({ items: [], hasNext: false })),
    ]);

    const latest = latestRes?.items || [];
    const popular = popRes?.items || [];

    const feed: HomeFeed = {
      slider: popular.slice(0, 5),
      today: latest.slice(0, 10),
      popular,
      latest,
    };
    return feed;
  },

  async getLatest(page: number): Promise<SourcePage> {
    const url = `${BASE_URL}/anime/?page=${page}`;
    const html = await fetchText(url, {
      source: "nimegami",
      timeoutMs: 10000,
    });
    const $ = cheerio.load(html);
    const items = parseCards($);
    return { items, hasNext: items.length >= 12 };
  },

  async getPopular(page: number): Promise<SourcePage> {
    const url =
      page === 1 ? `${BASE_URL}/anime-terbaik/minggu-ini/` : `${BASE_URL}/anime-terbaik/bulan-ini/`;
    const html = await fetchText(url, {
      source: "nimegami",
      timeoutMs: 10000,
    });
    const $ = cheerio.load(html);
    const items = parseCards($);
    return { items, hasNext: false };
  },

  async search(keyword: string, page: number = 1): Promise<SourcePage> {
    const cleanKeyword = cleanText(keyword);
    if (!cleanKeyword) return { items: [], hasNext: false };

    try {
      const data = await fetchJson<NimegamiSearchResponse>(
        `${BASE_URL}/api/anime-search/?q=${encodeURIComponent(cleanKeyword)}`,
        {
          source: "nimegami",
          headers: {
            accept: "application/json",
            Referer: `${BASE_URL}/`,
          },
          timeoutMs: 8000,
        },
      );

      const suggestions = data.suggestions || [];
      const pageSize = 15;
      const validPage = Number.isFinite(page) && page > 0 ? page : 1;
      const startIndex = (validPage - 1) * pageSize;
      const paged = suggestions.slice(startIndex, startIndex + pageSize);

      const items: SourceItem[] = paged.map((item) =>
        makeItem("nimegami", item.slug, {
          title: item.title,
          poster: cleanNimegamiPoster(item.poster, item.title),
          type: item.format || "TV",
          year: item.year ? String(item.year) : null,
        }),
      );

      return {
        items,
        hasNext: startIndex + pageSize < suggestions.length,
      };
    } catch {
      return { items: [], hasNext: false };
    }
  },

  async getGenres(): Promise<SourceGenre[]> {
    return cached("nimegami:genres", 60 * 60 * 1000, async () => {
      try {
        const html = await fetchText(`${BASE_URL}/genre/`, {
          source: "nimegami",
          timeoutMs: 10000,
        });
        const $ = cheerio.load(html);
        const genres: SourceGenre[] = [];
        $("a[href*='/category/']").each((_, el) => {
          const href = $(el).attr("href") || "";
          const slug = href.replace(/^.*\/category\//, "").replace(/\/+$/, "");
          const name = cleanText($(el).find("h2").text()) || cleanText($(el).text());
          if (slug && name && !genres.some((g) => g.id === slug)) {
            genres.push({ id: slug, name, image: null });
          }
        });
        return genres;
      } catch {
        return [];
      }
    });
  },

  async getByGenre(genre: string, page: number): Promise<SourcePage> {
    const cleanGenre = slugify(genre);
    const html = await fetchText(`${BASE_URL}/category/${cleanGenre}/?page=${page}`, {
      source: "nimegami",
      timeoutMs: 10000,
    });
    const $ = cheerio.load(html);
    const items = parseCards($);
    return { items, hasNext: items.length >= 12 };
  },

  async getDetail(slug: string): Promise<SourceDetail> {
    const cleanSlug = slug.replace(/^ng_/, "").replace(/^\/|\/$/g, "");
    return cached(`nimegami:detail:${cleanSlug}`, 15 * 60 * 1000, async () => {
      const raw = await loadRawDetail(cleanSlug);

      const detail: SourceDetail = {
        id: toAnimeId("nimegami", cleanSlug),
        source: "nimegami",
        title: raw.title,
        japanese: raw.japanese,
        poster: raw.poster,
        cover: raw.cover,
        synopsis: raw.synopsis,
        status: raw.status,
        type: raw.type,
        score: raw.score,
        genres: raw.genres,
        studio: null,
        producers: null,
        duration: null,
        aired: null,
        year: null,
        episodes: raw.episodes,
        recommended: raw.recommended,
      };
      return detail;
    });
  },

  async getStream(slug: string): Promise<SourceStream> {
    const cleanSlug = slug
      .replace(/^ng_ep_/, "")
      .replace(/^ng_/, "")
      .replace(/^\/|\/$/g, "");

    let animeSlug = cleanSlug;
    let epNumber = 1;

    const epMatch = cleanSlug.match(/^(.*?)(?:-ep-|-episode-)(\d+)$/i);
    if (epMatch) {
      animeSlug = epMatch[1] ?? cleanSlug;
      epNumber = parseInt(epMatch[2] ?? "1", 10) || 1;
    } else {
      const trailingEp = cleanSlug.match(/-(\d+)$/);
      if (trailingEp && !cleanSlug.includes("season")) {
        animeSlug = cleanSlug.replace(/-\d+$/, "");
        epNumber = parseInt(trailingEp[1] ?? "1", 10) || 1;
      }
    }

    const raw = await loadRawDetail(animeSlug);
    const allLinks = raw.links || [];

    // Filter links for this episode
    let epLinks = allLinks.filter((l) => l.episode === epNumber);
    if (epLinks.length === 0) {
      epLinks = allLinks.filter((l) => l.kind === "movie" || l.kind === "episode");
    }
    if (epLinks.length === 0) {
      epLinks = allLinks;
    }

    const servers: SourceServer[] = [];
    const seenServers = new Set<string>();

    for (const link of epLinks) {
      if (!isProviderActive(link)) continue;
      let playUrl = link.resolvedStreamUrl || link.playUrl || link.url;
      if (!playUrl) continue;
      const provider = link.providerName || link.provider || "Nimegami";
      const rawQuality = link.quality || "720p";
      const quality = rawQuality.includes("p") ? rawQuality : `${rawQuality}p`;
      const formattedQuality =
        quality === "1080p" ? "1080p FHD" : quality === "720p" ? "720p HD" : quality;

      // Ensure BerkasDrive / Nimegami embed stream pages are bypassed through nimegami-proxy
      if (
        (playUrl.includes("vsys-srv.berkasdrive.com") ||
          playUrl.includes("berkasdrive.com") ||
          playUrl.includes("direct-stor.berkasdrive.com") ||
          provider.toLowerCase().includes("nimegami")) &&
        !playUrl.startsWith("/api/nimegami-proxy")
      ) {
        playUrl = `/api/nimegami-proxy?url=${encodeURIComponent(playUrl)}`;
      }

      const key = `${provider}-${formattedQuality}-${playUrl}`;
      if (seenServers.has(key)) continue;
      seenServers.add(key);

      servers.push({
        name: `[SUB INDO] ${provider} (${quality})`,
        quality: formattedQuality,
        ref: { kind: "url", url: playUrl },
      });
    }

    // Sort servers: prioritize real streaming players (BerkasDrive, DesuDrive, MP4Upload, Mega embed) and higher resolutions
    servers.sort((a, b) => {
      const isAStream =
        a.name.includes("BerkasDrive") ||
        a.name.includes("DesuDrive") ||
        a.name.includes("MP4Upload") ||
        a.name.includes("Komikcast");
      const isBStream =
        b.name.includes("BerkasDrive") ||
        b.name.includes("DesuDrive") ||
        b.name.includes("MP4Upload") ||
        b.name.includes("Komikcast");
      if (isAStream && !isBStream) return -1;
      if (!isAStream && isBStream) return 1;

      const qWeight = (q: string) =>
        q.includes("1080") ? 1080 : q.includes("720") ? 720 : q.includes("480") ? 480 : 360;
      return qWeight(b.quality) - qWeight(a.quality);
    });

    // Group downloads by quality
    const downloadGroups = new Map<string, Array<{ title: string; url: string }>>();
    for (const link of epLinks) {
      if (link.url && isProviderActive(link)) {
        const q = link.quality || "720p";
        const list = downloadGroups.get(q) || [];
        list.push({ title: link.providerName || link.provider || "Download", url: link.url });
        downloadGroups.set(q, list);
      }
    }

    const downloads: DownloadQualityGroup[] = Array.from(downloadGroups.entries()).map(
      ([quality, urls]) => ({
        quality,
        size: null,
        urls,
      }),
    );

    const totalEpisodes = raw.episodes.length || 1;
    const prevEpisodeId =
      epNumber > 1 ? toEpisodeId("nimegami", `${animeSlug}-ep-${epNumber - 1}`) : null;
    const nextEpisodeId =
      epNumber < totalEpisodes ? toEpisodeId("nimegami", `${animeSlug}-ep-${epNumber + 1}`) : null;

    return {
      id: toEpisodeId("nimegami", cleanSlug),
      animeId: toAnimeId("nimegami", animeSlug),
      title: `${raw.title} Episode ${epNumber}`,
      releaseTime: null,
      servers,
      downloads,
      prevEpisodeId,
      nextEpisodeId,
    };
  },
};

/**
 * Convenience helper to fetch and parse anime detail with active streaming providers associated.
 */
export async function getAnimeDetail(slug: string): Promise<SourceDetail> {
  return nimegami.getDetail(slug);
}
