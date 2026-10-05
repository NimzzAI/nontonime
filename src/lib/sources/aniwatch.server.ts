import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { cached } from "./cache.server";
import {
  absUrl,
  cleanText,
  episodeNumberFrom,
  fetchText,
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

const DEFAULT_BASE = "https://aniwatch.cx";

function baseUrl(): string {
  return DEFAULT_BASE;
}

async function html(url: string): Promise<string> {
  return fetchText(url, { source: "aniwatch", headers: { Referer: `${baseUrl()}/` } });
}

function posterFor(slug: string, found: string | undefined): string {
  if (found) return absUrl(baseUrl(), found);
  return `${baseUrl()}/images/poster/${slug}.webp`;
}

function parseAnimeLinks($: CheerioAPI): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  $("a[href*='/anime/']").each((_, el) => {
    const slug = lastSegment($(el).attr("href"));
    const title = cleanText($(el).text());
    if (!slug || title.length <= 2 || seen.has(slug)) return;
    seen.add(slug);
    const holder = $(el).closest("div, article, li");
    const img = holder.find("img").first();
    items.push(
      makeItem("aniwatch", slug, {
        title,
        poster: posterFor(slug, img.attr("src") || img.attr("data-src")),
        type: "TV",
        status: "Ongoing",
      }),
    );
  });
  return items;
}

async function loadGenres(): Promise<SourceGenre[]> {
  return cached("aniwatch:genres", 60 * 60 * 1000, async () => {
    const $ = cheerio.load(await html(baseUrl()));
    const genres: SourceGenre[] = [];
    $("a[href*='/browse/']").each((_, el) => {
      const name = cleanText($(el).text());
      const slug = lastSegment($(el).attr("href")) || slugify(name);
      if (name && !genres.some((g) => g.id === slug)) genres.push({ id: slug, name, image: null });
    });
    return genres;
  });
}

export const aniwatch: AnimeSource = {
  id: "aniwatch",
  label: "Aniwatch",

  async getHome() {
    const items = parseAnimeLinks(cheerio.load(await html(`${baseUrl()}/home`)));
    const latest = items.slice(0, 15);
    const rest = items.slice(15);
    const feed: HomeFeed = { latest, popular: rest.length > 0 ? rest : latest };
    return feed;
  },

  async search(keyword, page): Promise<SourcePage> {
    const url = `${baseUrl()}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
    const items = parseAnimeLinks(cheerio.load(await html(url)));
    return { items, hasNext: items.length >= 10 };
  },

  getGenres: loadGenres,

  async getByGenre(genre, page): Promise<SourcePage> {
    const url = `${baseUrl()}/browse/${slugify(genre)}?page=${page}`;
    const items = parseAnimeLinks(cheerio.load(await html(url)));
    return { items, hasNext: items.length >= 10 };
  },

  async getDetail(slug) {
    const clean = lastSegment(slug);
    const $ = cheerio.load(await html(`${baseUrl()}/anime/${clean}`));

    const title = cleanText($("h1").first().text()) || cleanText($("title").text().split("-")[0]);
    if (!title) throw new Error(`Anime ${clean} tidak ditemukan`);

    const poster = posterFor(clean, $("img[src*='poster'], .film-poster img, img").first().attr("src"));
    const synopsis =
      $(".description, .synopsis, p")
        .map((_, el) => $(el).text().trim())
        .get()
        .find((text) => text.length > 50) || null;

    const genres: string[] = [];
    $("a[href*='/browse/']").each((_, el) => {
      const name = cleanText($(el).text());
      if (name && !genres.includes(name)) genres.push(name);
    });

    // Daftar episode lengkap ada di halaman episode pertama
    const firstEp = $("a[href*='/episode/']").first().attr("href");
    let $eps = $;
    if (firstEp) {
      try {
        $eps = cheerio.load(await html(absUrl(baseUrl(), firstEp)));
      } catch {
        $eps = $;
      }
    }

    const episodes: SourceEpisode[] = [];
    const seen = new Set<string>();
    $eps("a[href*='/episode/']").each((idx, el) => {
      const epSlug = lastSegment($eps(el).attr("href"));
      const text = cleanText($eps(el).text());
      if (!epSlug || seen.has(epSlug)) return;
      if (text.toLowerCase() === "next" || text.toLowerCase() === "prev") return;
      seen.add(epSlug);
      const number = episodeNumberFrom(text, idx + 1);
      episodes.push({
        id: toEpisodeId("aniwatch", epSlug),
        number,
        title: text || `Episode ${number}`,
        date: null,
      });
    });
    if (episodes.length === 0) {
      episodes.push({ id: toEpisodeId("aniwatch", `${clean}-1`), number: 1, title: "Episode 1", date: null });
    }
    episodes.sort((a, b) => a.number - b.number);

    const detail: SourceDetail = {
      id: toAnimeId("aniwatch", clean),
      source: "aniwatch",
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
    const page = await html(`${baseUrl()}/episode/${clean}`);
    const $ = cheerio.load(page);

    const title = cleanText($("h1").first().text()) || cleanText($("title").text());
    const anilistId = page.match(/anilistId\s*=\s*(\d+)/)?.[1];
    const epNumber = (clean.match(/-(\d+)-/) ?? clean.match(/-(\d+)$/))?.[1] ?? "1";

    const servers: SourceServer[] = [];
    if (anilistId) {
      servers.push(
        {
          name: "VidNest Sub",
          quality: "Auto",
          ref: { kind: "url", url: `https://vidnest.fun/anime/${anilistId}/${epNumber}/sub` },
        },
        {
          name: "TryEmbed Sub",
          quality: "Auto",
          ref: { kind: "url", url: `https://tryembed.us.cc/embed/anime/${anilistId}/${epNumber}/sub` },
        },
        {
          name: "VidNest Dub",
          quality: "Auto",
          ref: { kind: "url", url: `https://vidnest.fun/anime/${anilistId}/${epNumber}/dub` },
        },
      );
    }
    servers.push({
      name: "Server Cadangan",
      quality: "Auto",
      ref: { kind: "url", url: `${baseUrl()}/episode/${clean}` },
    });

    const ownerHref = $("a[href*='/anime/']").first().attr("href");
    const owner = lastSegment(ownerHref) || clean.replace(/-(?:episode-)?\d+$/, "");

    const stream: SourceStream = {
      id: toEpisodeId("aniwatch", clean),
      animeId: owner ? toAnimeId("aniwatch", owner) : "",
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
