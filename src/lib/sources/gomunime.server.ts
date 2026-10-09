import crypto from "node:crypto";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { cached } from "./cache.server";
import {
  BROWSER_UA,
  episodeNumberFrom,
  fetchText,
  lastSegment,
  parseNumber,
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

const DEFAULT_BASE = "https://ww2.gomunime.org";

function baseUrl(): string {
  return DEFAULT_BASE;
}

async function html(url: string, timeoutMs = 10000): Promise<string> {
  try {
    return await fetchText(url, {
      source: "gomunime",
      headers: { Referer: `${baseUrl()}/` },
      timeoutMs,
    });
  } catch (error) {
    // If blocked with 403 or server unreachable, recover silently without spamming errors
    return "";
  }
}

// Player Putarin menaruh konfigurasi terenkripsi AES-GCM di halamannya, kuncinya diminta dari origin yang sama
async function decryptPutarin(putarinUrl: string): Promise<string | null> {
  try {
    const page = await fetchText(putarinUrl, {
      source: "gomunime",
      headers: { Referer: `${baseUrl()}/` },
      timeoutMs: 8000,
    });
    const match = page.match(/window\.__PX\s*=\s*(\{[^;]+\});/);
    if (!match?.[1]) return null;
    const px = JSON.parse(match[1]) as { n?: string; d?: string };
    if (!px.n || !px.d) return null;

    const origin = new URL(putarinUrl).origin;
    const hexKey = await fetchText(`${origin}/api/pk?n=${encodeURIComponent(px.n)}`, {
      source: "gomunime",
      headers: { Referer: putarinUrl, "User-Agent": BROWSER_UA },
      timeoutMs: 8000,
    });
    const key = Buffer.from(hexKey.trim(), "hex");
    const raw = Buffer.from(px.d, "base64");
    const iv = raw.subarray(0, 12);
    const body = raw.subarray(12);
    const tag = body.subarray(body.length - 16);
    const cipherText = body.subarray(0, body.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = decipher.update(cipherText, undefined, "utf8") + decipher.final("utf8");
    const config = JSON.parse(decrypted) as { file?: string };
    if (!config.file) return null;
    return config.file.startsWith("http") ? config.file : `${origin}${config.file}`;
  } catch {
    return null;
  }
}

function parseCards($: CheerioAPI, selector: string): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  $(selector).each((_, el) => {
    const node = $(el);
    const a = node.is("a") ? node : node.find("a").first();
    const slug = lastSegment(a.attr("href"));
    const img = node.find("img").first();
    const poster = img.attr("src") || img.attr("data-src") || "";
    const title = (
      node.find(".gm-c-mt h3, .gm-c-mt, h3, h2").first().text().trim() ||
      a.attr("title") ||
      ""
    )
      .split("•")[0]
      ?.trim();
    if (!slug || !title || seen.has(slug)) return;
    seen.add(slug);
    const nodeText = node.text().toLowerCase();
    let status: string | null = null;
    if (
      nodeText.includes("completed") ||
      nodeText.includes("tamat") ||
      nodeText.includes("finish")
    ) {
      status = "Completed";
    } else if (nodeText.includes("ongoing") || nodeText.includes("tayang")) {
      status = "Ongoing";
    }

    items.push(
      makeItem("gomunime", slug, {
        title,
        poster,
        type: "TV",
        status,
        score: parseNumber(node.find(".gm-b-rt").text().replace("★", "").trim()),
        episodeLabel: node.find(".gm-b-ep").text().trim() || null,
      }),
    );
  });
  return items;
}

async function loadGenres(): Promise<SourceGenre[]> {
  return cached("gomunime:genres", 60 * 60 * 1000, async () => {
    const $ = cheerio.load(await html(baseUrl()));
    const genres: SourceGenre[] = [];
    $(".gm-chips a, .gm-chip").each((_, el) => {
      const name = $(el).text().trim();
      const slug = lastSegment($(el).attr("href")) || slugify(name);
      if (name && !genres.some((g) => g.id === slug)) genres.push({ id: slug, name, image: null });
    });
    return genres;
  });
}

async function firstHtml(urls: string[]): Promise<{ page: string; url: string }> {
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      return { page: await html(url), url };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Halaman Gomunime tidak ditemukan");
}

function pageUrls(kind: "anime" | "nonton", slug: string): string[] {
  const encoded = encodeURIComponent(decodeURIComponent(slug));
  const other = kind === "anime" ? "nonton" : "anime";
  return [
    `${baseUrl()}/${kind}/${slug}/`,
    `${baseUrl()}/${kind}/${encoded}/`,
    `${baseUrl()}/${other}/${slug}/`,
  ];
}

export const gomunime: AnimeSource = {
  id: "gomunime",
  label: "Gomunime",

  async getHome() {
    const $ = cheerio.load(await html(baseUrl()));
    const latest = parseCards($, ".gm-sec .gm-c");
    const popular = parseCards($, ".gm-rail-top .gm-c-top, .gm-rail .gm-c").map((item) => ({
      ...item,
      status: "Popular",
      episodeLabel: null,
    }));
    const feed: HomeFeed = {
      latest,
      popular: popular.length > 0 ? popular : latest.slice(0, 10),
    };
    return feed;
  },

  async search(keyword, page): Promise<SourcePage> {
    const q = encodeURIComponent(keyword);
    const url = page > 1 ? `${baseUrl()}/page/${page}/?s=${q}` : `${baseUrl()}/?s=${q}`;
    const items = parseCards(cheerio.load(await html(url)), ".gm-c, article, .animepost");
    return { items, hasNext: items.length >= 10 };
  },

  getGenres: loadGenres,

  async getByGenre(genre, page): Promise<SourcePage> {
    const slug = slugify(genre);
    const url =
      page > 1 ? `${baseUrl()}/genre/${slug}/page/${page}/` : `${baseUrl()}/genre/${slug}/`;
    const items = parseCards(cheerio.load(await html(url)), ".gm-c, article, .animepost");
    return { items, hasNext: items.length >= 10 };
  },

  async getDetail(slug) {
    const clean = lastSegment(slug);
    const { page } = await firstHtml(pageUrls("anime", clean));
    const $ = cheerio.load(page);

    const title =
      $("h1")
        .first()
        .text()
        .replace(/^Nonton\s+Anime\s+/i, "")
        .replace(/\s+Sub\s+Indo.*$/i, "")
        .trim() ||
      $("title").text().split("–")[0]?.trim() ||
      "";
    if (!title) throw new Error(`Anime ${clean} tidak ditemukan`);

    const poster =
      $(".gm-poster img, .gm-detail img, .animeposter img, img").first().attr("src") || null;
    const synopsis =
      $(".gm-sinopsis, .sinopsis, .desc, p")
        .map((_, el) => $(el).text().trim())
        .get()
        .find((text) => text.length > 30) || null;

    const genres: string[] = [];
    $(".gm-chips a, .gm-chip, .genre a, a[href*='/genre/']").each((_, el) => {
      const name = $(el).text().trim();
      if (name && !genres.includes(name)) genres.push(name);
    });

    const episodes: SourceEpisode[] = [];
    const seen = new Set<string>();
    $("a[href*='/nonton/']").each((idx, el) => {
      const epSlug = lastSegment($(el).attr("href"));
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (!epSlug || seen.has(epSlug)) return;
      seen.add(epSlug);
      const number = episodeNumberFrom(text, idx + 1);
      episodes.push({
        id: toEpisodeId("gomunime", epSlug),
        number,
        title: text || `Episode ${number}`,
        date: null,
      });
    });
    if (episodes.length === 0) {
      episodes.push({ id: toEpisodeId("gomunime", clean), number: 1, title, date: null });
    }
    episodes.sort((a, b) => a.number - b.number);

    const rating = parseNumber(
      $(".gm-b-rt, .rating, .score, .imdbRating").first().text().replace("★", "").trim(),
    );

    const detail: SourceDetail = {
      id: toAnimeId("gomunime", clean),
      source: "gomunime",
      title,
      japanese: null,
      poster,
      cover: poster,
      synopsis,
      status: "Ongoing",
      type: "TV",
      score: rating ? String(rating) : null,
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
    const { page } = await firstHtml(pageUrls("nonton", clean));
    const $ = cheerio.load(page);

    const title = $("h1").first().text().trim() || $("title").text().trim();
    const iframeSrc = $("iframe").first().attr("src") || "";
    const servers: SourceServer[] = [];

    if (iframeSrc.includes("putarin")) {
      const direct = await decryptPutarin(iframeSrc);
      if (direct) {
        servers.push({
          name: "Putarin Langsung",
          quality: "Auto",
          ref: { kind: "url", url: direct },
        });
      }
    }
    if (iframeSrc) {
      servers.push({ name: "Server Web", quality: "Auto", ref: { kind: "url", url: iframeSrc } });
    }

    $("option, .gm-server-btn, .server-btn").each((idx, el) => {
      const url = $(el).attr("value") || $(el).attr("data-src") || "";
      if (!url.startsWith("http") || servers.some((s) => s.ref.kind === "url" && s.ref.url === url))
        return;
      servers.push({
        name: $(el).text().trim() || `Server ${idx + 1}`,
        quality: "Auto",
        ref: { kind: "url", url },
      });
    });

    const ownerHref = $("a[href*='/anime/']").first().attr("href");
    const owner = lastSegment(ownerHref);

    const stream: SourceStream = {
      id: toEpisodeId("gomunime", clean),
      animeId: owner ? toAnimeId("gomunime", owner) : "",
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
