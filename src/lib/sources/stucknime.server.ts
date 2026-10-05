import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { cached } from "./cache.server";
import {
  absUrl,
  cleanText,
  episodeNumberFrom,
  fetchText,
  isDirectMediaUrl,
  lastSegment,
  slugify,
} from "./http.server";
import { makeItem, toAnimeId, toEpisodeId } from "./ids";
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

const DEFAULT_BASE = "https://stucknime.my.id";

function baseUrl(): string {
  return DEFAULT_BASE;
}

async function html(url: string): Promise<string> {
  return fetchText(url, { source: "stucknime", headers: { Referer: `${baseUrl()}/` } });
}

function parseLinks($: CheerioAPI): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href.startsWith("/anime/") && !href.startsWith("/watch/")) return;
    const slug = href.replace(/^\/(anime|watch)\//, "").replace(/\/+$/, "");
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    const img = $(el).closest("div").find("img").first().attr("src") || "";
    items.push(
      makeItem("stucknime", slug, {
        title: cleanText($(el).text()) || slug.replace(/-/g, " "),
        poster: absUrl(baseUrl(), img),
        type: "TV",
        status: "Ongoing",
      }),
    );
  });
  return items;
}

async function loadGenres(): Promise<SourceGenre[]> {
  return cached("stucknime:genres", 60 * 60 * 1000, async () => {
    const $ = cheerio.load(await html(`${baseUrl()}/genres`));
    const genres: SourceGenre[] = [];
    $("a[href*='/genres/']").each((_, el) => {
      const name = cleanText($(el).text());
      const slug = lastSegment($(el).attr("href")) || slugify(name);
      if (name && !genres.some((g) => g.id === slug)) genres.push({ id: slug, name, image: null });
    });
    return genres;
  });
}

export const stucknime: AnimeSource = {
  id: "stucknime",
  label: "Stucknime",

  async getHome() {
    const feed: HomeFeed = { latest: parseLinks(cheerio.load(await html(baseUrl()))) };
    return feed;
  },

  async search(keyword, page): Promise<SourcePage> {
    const url = `${baseUrl()}/search?q=${encodeURIComponent(keyword)}&page=${page}`;
    const items = parseLinks(cheerio.load(await html(url)));
    return { items, hasNext: items.length >= 10 };
  },

  getGenres: loadGenres,

  async getByGenre(genre, page): Promise<SourcePage> {
    const url = `${baseUrl()}/genres/${slugify(genre)}?page=${page}`;
    const items = parseLinks(cheerio.load(await html(url)));
    return { items, hasNext: items.length >= 10 };
  },

  async getDetail(slug) {
    const clean = lastSegment(slug);
    const $ = cheerio.load(await html(`${baseUrl()}/anime/${clean}`));

    const title = cleanText($("h1").first().text()) || clean.replace(/-/g, " ");
    const poster = absUrl(baseUrl(), $("img").first().attr("src")) || null;
    const synopsis =
      $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .find((text) => text.length > 30) || null;

    const genres: string[] = [];
    $("a[href*='/genres/']").each((_, el) => {
      const name = cleanText($(el).text());
      if (name && !genres.includes(name)) genres.push(name);
    });

    const episodes: SourceEpisode[] = [];
    const seen = new Set<string>();
    $("a[href*='/watch/']").each((idx, el) => {
      const epSlug = lastSegment($(el).attr("href"));
      const text = cleanText($(el).text());
      if (!epSlug || seen.has(epSlug)) return;
      seen.add(epSlug);
      const number = episodeNumberFrom(text || epSlug, idx + 1);
      episodes.push({
        id: toEpisodeId("stucknime", epSlug),
        number,
        title: text || `Episode ${number}`,
        date: null,
      });
    });
    if (episodes.length === 0) {
      episodes.push({
        id: toEpisodeId("stucknime", `${clean}-episode-1`),
        number: 1,
        title: "Episode 1",
        date: null,
      });
    }
    episodes.sort((a, b) => a.number - b.number);

    const detail: SourceDetail = {
      id: toAnimeId("stucknime", clean),
      source: "stucknime",
      title,
      japanese: null,
      poster,
      cover: poster,
      synopsis,
      status: "Ongoing",
      type: "TV",
      score: null,
      genres,
      studio: null,
      producers: null,
      duration: null,
      aired: null,
      year: null,
      episodes,
      recommended: [],
    };
    return detail;
  },

  async getStream(slug) {
    const clean = lastSegment(slug);
    const pageUrl = `${baseUrl()}/watch/${clean}`;
    const $ = cheerio.load(await html(pageUrl));

    const title = cleanText($("h1").first().text()) || clean.replace(/-/g, " ");
    const iframeSrc = $("iframe").first().attr("src") || "";

    const servers: SourceServer[] = [];
    if (iframeSrc) {
      servers.push({
        name: isDirectMediaUrl(iframeSrc) ? "Player Langsung" : "Player Utama",
        quality: "Auto",
        ref: { kind: "url", url: absUrl(baseUrl(), iframeSrc) },
      });
    }
    servers.push({ name: "Halaman Web", quality: "Auto", ref: { kind: "url", url: pageUrl } });

    const owner = clean.replace(/-episode-\d+.*$/, "");
    const stream: SourceStream = {
      id: toEpisodeId("stucknime", clean),
      animeId: owner ? toAnimeId("stucknime", owner) : "",
      title,
      releaseTime: null,
      servers,
      downloads: [],
      prevEpisodeId: null,
      nextEpisodeId: null,
    };
    return stream;
  },
};
