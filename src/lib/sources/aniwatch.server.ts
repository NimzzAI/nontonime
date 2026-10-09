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

function posterFor(slug: string, found: string | undefined, title?: string): string {
  if (
    found &&
    !found.includes("no-poster") &&
    !found.includes("logo") &&
    !found.startsWith("data:")
  ) {
    return absUrl(baseUrl(), found);
  }
  return title
    ? `/api/image-proxy?title=${encodeURIComponent(title)}`
    : `${baseUrl()}/images/poster/${slug}.webp`;
}

function parseAnimeLinks($: CheerioAPI): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();

  // 1. Structured cards (Aniwatch home, browse, search)
  const cards = $(
    ".awt-flw-item, .flw-item, .film_list-wrap .film-poster, .film_list-wrap .flw-item, .item, article",
  );
  if (cards.length > 0) {
    cards.each((_, el) => {
      const card = $(el);
      const a = card.find(".awt-film-name a, .film-name a, a[href*='/anime/']").first();
      const href = a.attr("href") || "";
      const slug =
        href.split("/anime/")[1]?.split(/[/?#]/)[0] || href.split("/").filter(Boolean).pop() || "";
      if (!slug || seen.has(slug)) return;

      const img = card.find("img.awt-film-poster-img, .film-poster img, img").first();
      const rawPoster = img.attr("src") || img.attr("data-src") || "";
      const title =
        cleanText(card.find(".awt-film-name a, .film-name a").first().text()) ||
        cleanText(a.attr("title")) ||
        cleanText(img.attr("alt")) ||
        "";

      if (!title || title.length <= 2 || title.toLowerCase() === "detail") return;
      seen.add(slug);

      const cardText = card.text().toLowerCase();
      let status: string | null = null;
      if (
        cardText.includes("completed") ||
        cardText.includes("finish") ||
        cardText.includes("tamat")
      ) {
        status = "Completed";
      } else if (cardText.includes("ongoing") || cardText.includes("tayang")) {
        status = "Ongoing";
      }

      items.push(
        makeItem("aniwatch", slug, {
          title,
          poster: posterFor(slug, rawPoster, title),
          type: "TV",
          status,
        }),
      );
    });
  }

  // 2. Generic fallback if structured cards were not found
  if (items.length === 0) {
    $("a[href*='/anime/']").each((_, el) => {
      const a = $(el);
      const href = a.attr("href") || "";
      const slug = lastSegment(href);
      if (!slug || seen.has(slug)) return;

      const holder = a.closest("div, article, li");
      const img = holder.find("img").first();
      const rawPoster = img.attr("src") || img.attr("data-src") || "";
      const title =
        cleanText(a.text()) || cleanText(a.attr("title")) || cleanText(img.attr("alt")) || "";

      if (!title || title.length <= 2 || title.toLowerCase() === "detail") return;
      seen.add(slug);

      const holderText = holder.text().toLowerCase();
      let status: string | null = null;
      if (
        holderText.includes("completed") ||
        holderText.includes("finish") ||
        holderText.includes("tamat")
      ) {
        status = "Completed";
      } else if (holderText.includes("ongoing") || holderText.includes("tayang")) {
        status = "Ongoing";
      }

      items.push(
        makeItem("aniwatch", slug, {
          title,
          poster: posterFor(slug, rawPoster, title),
          type: "TV",
          status,
        }),
      );
    });
  }

  return items;
}

async function loadGenres(): Promise<SourceGenre[]> {
  return cached("aniwatch:genres", 60 * 60 * 1000, async () => {
    let $ = cheerio.load(await html(`${baseUrl()}/home`));
    let links = $("a[href*='/browse/']");
    if (links.length === 0) {
      $ = cheerio.load(await html(baseUrl()));
      links = $("a[href*='/browse/']");
    }

    const genres: SourceGenre[] = [];
    links.each((_, el) => {
      const rawName = cleanText($(el).text());
      const cleanName = rawName.replace(/\s*anime$/i, "").trim();
      const slug = lastSegment($(el).attr("href")) || slugify(cleanName);
      if (
        cleanName &&
        cleanName.length > 2 &&
        !genres.some((g) => g.id === slug || g.name.toLowerCase() === cleanName.toLowerCase())
      ) {
        genres.push({ id: slug, name: cleanName, image: null });
      }
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

    // If an episode slug was passed directly (e.g. yuruyuri-nachuyachumi-1-c5d95)
    if (/-\d+-[a-f0-9]{4,8}$/i.test(clean) || /-\d+$/.test(clean)) {
      try {
        const epPage = await html(`${baseUrl()}/episode/${clean}`);
        const $ep = cheerio.load(epPage);
        const ownerHref = $ep("a[href*='/anime/']").first().attr("href");
        if (ownerHref) {
          const ownerSlug = lastSegment(ownerHref);
          if (ownerSlug && ownerSlug !== clean) {
            return aniwatch.getDetail(ownerSlug);
          }
        }
      } catch {
        // ignore episode probe error
      }
    }

    let pageHtml = "";
    try {
      pageHtml = await html(`${baseUrl()}/anime/${clean}`);
    } catch (err) {
      // In case slug has name-hash instead of hash-name (e.g. yuruyuri-nachuyachumi-c5d95 vs c5d95-yuruyuri-nachuyachumi)
      const inverted = clean.replace(/^(.+)-([a-f0-9]{4,8})$/i, "$2-$1");
      if (inverted !== clean) {
        try {
          pageHtml = await html(`${baseUrl()}/anime/${inverted}`);
        } catch {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const $ = cheerio.load(pageHtml);

    const title = cleanText($("h1").first().text()) || cleanText($("title").text().split("-")[0]);
    if (!title) throw new Error(`Anime ${clean} tidak ditemukan`);

    let foundPoster = "";
    $(".an-poster img, .film-poster img, .awt-film-poster-img, img[src*='poster/']").each(
      (_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        if (src && !src.includes("logo") && !src.startsWith("data:")) {
          foundPoster = src;
          return false;
        }
      },
    );
    const poster = posterFor(clean, foundPoster || undefined, title);
    // Synopsis: accurately target the anime description container and avoid promo banners
    let rawSynopsis = cleanText(
      $(".awt-film-description, .film-description, .description, .synopsis").first().text(),
    );
    if (!rawSynopsis || rawSynopsis.toLowerCase().includes("keep your own anime list")) {
      const candidates = $("p")
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter(
          (t) =>
            t.length > 50 &&
            !t.toLowerCase().includes("keep your own anime list") &&
            !t.toLowerCase().includes("indexing service") &&
            !t.toLowerCase().includes("rights reserved"),
        );
      rawSynopsis = candidates[0] || "";
    }
    const synopsis = rawSynopsis ? rawSynopsis.replace(/^synopsis[:\s]*/i, "").trim() : null;

    // Genres: strictly scoped to anime details list (prevent navbar menu leakage)
    const genres: string[] = [];
    $(
      ".awt-item-list a[href*='/browse/'], .an-info a[href*='/browse/'], .film-infor a[href*='/browse/']",
    ).each((_, el) => {
      const name = cleanText($(el).text());
      if (name && !genres.includes(name)) genres.push(name);
    });

    // Metadata details from .awt-item
    let japanese: string | null = null;
    let status = "Ongoing";
    let type = "TV";
    let score: string | null = null;
    let studio: string | null = null;
    let duration: string | null = null;
    let aired: string | null = null;
    let year: string | null = null;

    $(".awt-item").each((_, el) => {
      const head = cleanText($(el).find(".awt-item-head").text()).toLowerCase();
      const clone = $(el).clone();
      clone.find(".awt-item-head").remove();
      const val = cleanText(clone.text());

      if (head.includes("japanese")) japanese = val || null;
      if (head.includes("status") && val) {
        status = val.toLowerCase().includes("finish") ? "Completed" : "Ongoing";
      }
      if ((head.includes("format") || head.includes("type")) && val) type = val;
      if (head.includes("rating") && val) {
        const parsed = val.split("/")[0]?.trim();
        if (parsed) score = parsed;
      }
      if (head.includes("studio") || head.includes("studios")) {
        const link = $(el).find("a").first().text();
        studio = cleanText(link) || val || null;
      }
      if (head.includes("duration") && val) duration = val;
      if (head.includes("aired") && val) aired = val;
      if (head.includes("year") && val) year = val;
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
    $eps("a[href*='/episode/'], .ws-ep").each((idx, el) => {
      const targetEl = $eps(el);
      const epHref = targetEl.attr("href") || targetEl.attr("data-url") || "";
      const epSlug = lastSegment(epHref);
      const text = cleanText(targetEl.text());
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
      episodes.push({
        id: toEpisodeId("aniwatch", `${clean}-1`),
        number: 1,
        title: "Episode 1",
        date: null,
      });
    }
    episodes.sort((a, b) => a.number - b.number);

    const detail: SourceDetail = {
      id: toAnimeId("aniwatch", clean),
      source: "aniwatch",
      title,
      japanese,
      poster,
      cover: poster,
      synopsis,
      status,
      type,
      score,
      genres,
      studio,
      producers: null,
      duration,
      aired,
      year,
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
    const hianimeMatch = page.match(/currentHianimeEpId\s*=\s*['"]([^'"]+)['"]/);
    const anilistMatch = page.match(/anilistId\s*=\s*(\d+)/);
    const malMatch = page.match(/malId\s*=\s*(\d+)/);

    const anilistId = anilistMatch?.[1];
    const malId = malMatch?.[1];
    const epNumber = (clean.match(/-(\d+)-/) ?? clean.match(/-(\d+)$/))?.[1] ?? "1";

    let epId = "";
    if (hianimeMatch?.[1]) {
      try {
        epId =
          Buffer.from(hianimeMatch[1].replace(/-/g, "+").replace(/_/g, "/"), "base64")
            .toString("utf8")
            .split(":")[0] || "";
      } catch {
        // ignore token decode error
      }
    }

    const servers: SourceServer[] = [];

    // Priority 1: MegaPlay Sub (Native HD Stream)
    if (epId) {
      servers.push({
        name: "MegaPlay Sub (Utama)",
        quality: "Auto",
        ref: { kind: "url", url: `https://megaplay.buzz/stream/s-2/${epId}/sub` },
      });
    }

    // Priority 2: VidNest and TryEmbed
    if (anilistId) {
      servers.push(
        {
          name: "VidNest Sub",
          quality: "Auto",
          ref: { kind: "url", url: `https://vidnest.fun/anime/${anilistId}/${epNumber}/sub` },
        },
        {
          name: "VidNest AnimePahe",
          quality: "Auto",
          ref: { kind: "url", url: `https://vidnest.fun/animepahe/${anilistId}/${epNumber}/sub` },
        },
        {
          name: "TryEmbed Sub",
          quality: "Auto",
          ref: {
            kind: "url",
            url: `https://tryembed.us.cc/embed/anime/${anilistId}/${epNumber}/sub`,
          },
        },
      );
      if (epId) {
        servers.push({
          name: "MegaPlay AniList",
          quality: "Auto",
          ref: {
            kind: "url",
            url: `https://megaplay.buzz/stream/ani/${anilistId}/${epNumber}/sub`,
          },
        });
      }
    }

    if (malId) {
      servers.push({
        name: "MegaPlay MAL",
        quality: "Auto",
        ref: { kind: "url", url: `https://megaplay.buzz/stream/mal/${malId}/${epNumber}/sub` },
      });
    }

    if (epId) {
      servers.push({
        name: "MegaPlay Dub",
        quality: "Auto",
        ref: { kind: "url", url: `https://megaplay.buzz/stream/s-2/${epId}/dub` },
      });
    }

    if (anilistId) {
      servers.push({
        name: "VidNest Dub",
        quality: "Auto",
        ref: { kind: "url", url: `https://vidnest.fun/anime/${anilistId}/${epNumber}/dub` },
      });
    }

    // Priority 3: Server Bypass Aniwatch via embed-proxy (frame busters & CSP stripped)
    servers.push({
      name: "Bypass Embed (Aniwatch)",
      quality: "Auto",
      ref: {
        kind: "url",
        url: `/api/embed-proxy?url=${encodeURIComponent(`${baseUrl()}/episode/${clean}`)}`,
      },
    });

    const ownerHref = $("a[href*='/anime/']").first().attr("href");
    const owner = lastSegment(ownerHref) || clean.replace(/-(?:episode-)?\d+.*$/, "");

    // Previous & Next navigation
    const prevHref =
      $(".btn-ep-nav:not(.btn-ep-nav--next)").first().attr("href") ||
      $(`.ws-ep[data-episode="${Number(epNumber) - 1}"]`).attr("data-url");
    const nextHref =
      $(".btn-ep-nav--next").first().attr("href") ||
      $(`.ws-ep[data-episode="${Number(epNumber) + 1}"]`).attr("data-url");
    const prevSlug = prevHref ? lastSegment(prevHref) : null;
    const nextSlug = nextHref ? lastSegment(nextHref) : null;

    const stream: SourceStream = {
      id: toEpisodeId("aniwatch", clean),
      animeId: owner ? toAnimeId("aniwatch", owner) : "",
      title,
      releaseTime: null,
      servers,
      downloads: [],
      prevEpisodeId: prevSlug ? toEpisodeId("aniwatch", prevSlug) : null,
      nextEpisodeId: nextSlug ? toEpisodeId("aniwatch", nextSlug) : null,
    };
    return stream;
  },
};
