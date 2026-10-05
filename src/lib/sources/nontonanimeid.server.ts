import * as cheerio from "cheerio";
import type { CheerioAPI, Element } from "cheerio";
import { cached } from "./cache.server";
import { absUrl, cleanText, episodeNumberFrom, fetchText, lastSegment, slugify } from "./http.server";
import { makeItem, toAnimeId, toEpisodeId } from "./ids";
import { assertPublicHttpUrl } from "./token.server";
import type {
  AnimeSource,
  HomeFeed,
  ServerRef,
  SourceDetail,
  SourceEpisode,
  SourceGenre,
  SourceItem,
  SourcePage,
  SourceServer,
  SourceStream,
} from "./types";
import type { DownloadQualityGroup } from "../anime-types";

const DEFAULT_BASE = "https://s13.nontonanimeid.boats";

function baseUrl(): string {
  return DEFAULT_BASE;
}

interface Page {
  $: CheerioAPI;
  nonce: string | null;
  ajax: string | null;
  url: string;
}

async function load(url: string, params: Record<string, string> = {}): Promise<Page> {
  const query = new URLSearchParams(params).toString();
  const finalUrl = query ? `${url}?${query}` : url;
  const html = await fetchText(finalUrl, {
    source: "nontonanimeid",
    headers: { Referer: baseUrl(), Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    timeoutMs: 12000,
  });
  const $ = cheerio.load(html);

  let nonce: string | null = null;
  let ajax: string | null = null;
  $("script").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (!src.startsWith("data:text/javascript;base64,")) return;
    try {
      const decoded = Buffer.from(src.split("base64,")[1] ?? "", "base64").toString("utf-8");
      const nonceMatch = decoded.match(/"nonce"\s*:\s*"([^"]+)"/);
      const urlMatch = decoded.match(/"url"\s*:\s*"([^"]+)"/);
      if (nonceMatch?.[1]) nonce = nonceMatch[1];
      if (urlMatch?.[1]) ajax = urlMatch[1].replace(/\\/g, "");
    } catch {
      // Script tanpa data nonce dilewati
    }
  });
  return { $, nonce, ajax, url: finalUrl };
}

interface Card {
  title: string;
  link: string;
  image: string;
  rating: number | null;
  type: string;
  season: string;
  synopsis: string;
  genres: string[];
}

function parseCard($: CheerioAPI, el: Element): Card {
  const card = $(el);
  const img = card.find("img");
  const image = img.attr("src") || img.attr("data-src") || "";

  let title = "";
  const titleTag = card.find('[class*="title"]');
  if (titleTag.length > 0) {
    const span = titleTag.find("span");
    title =
      span.length > 0 ? span.attr("data-title-default") || span.text().trim() : titleTag.text().trim();
  } else if (img.length > 0) {
    title = img.attr("alt") || "";
  }

  let rating: number | null = null;
  const ratingTag = card.find(".rating, .kotakscore, .as-rating");
  if (ratingTag.length > 0) {
    const num = parseFloat(ratingTag.text().replace("⭐", "").trim());
    if (!Number.isNaN(num) && num > 0) rating = num;
  }

  const genres: string[] = [];
  const genresBox = card.find('[class*="genres"]');
  const tags =
    genresBox.length > 0
      ? genresBox.find(".genre-tag, .genre-pill, .as-genre-tag")
      : card.find(".genre-tag, .genre-pill, .as-genre-tag");
  tags.each((_, g) => {
    const name = $(g).text().trim();
    if (name) genres.push(name);
  });

  return {
    title: title.trim(),
    link: card.attr("href") || "",
    image,
    rating,
    type: card.find(".type, .as-type").text().replace("📺", "").trim(),
    season: card.find(".season, .as-season").text().replace("📅", "").trim(),
    synopsis: card.find(".synopsis, .as-synopsis").text().trim(),
    genres,
  };
}

function cardItem(card: Card, extra: { episodeLabel?: string; status?: string } = {}): SourceItem | null {
  const slug = lastSegment(card.link);
  if (!slug || !card.title) return null;
  return makeItem("nontonanimeid", slug, {
    title: card.title,
    poster: card.image,
    type: card.type || "TV",
    status: extra.status ?? (card.season || null),
    score: card.rating,
    genres: card.genres,
    synopsis: card.synopsis || null,
    episodeLabel: extra.episodeLabel ?? null,
  });
}

function compact(items: (SourceItem | null)[]): SourceItem[] {
  return items.filter((item): item is SourceItem => item !== null);
}

function parseGrid($: CheerioAPI): SourceItem[] {
  const out: SourceItem[] = [];
  const grid = $("div.result");
  const cards = grid.find("a.as-anime-card");
  if (cards.length > 0) {
    cards.each((_, el) => {
      out.push(...compact([cardItem(parseCard($, el))]));
    });
  } else {
    grid.find("div.animeseries").each((_, el) => {
      const a = $(el).find("a").first();
      const node = a.get(0);
      if (node) out.push(...compact([cardItem(parseCard($, node))]));
    });
  }
  return out;
}

function parseTab($: CheerioAPI, tabId: string, status: string | null): SourceItem[] {
  const out: SourceItem[] = [];
  $(`#${tabId} div.animeseries`).each((_, el) => {
    const a = $(el).find("a").first();
    if (a.length === 0) return;
    const img = a.find("img");
    const titleDiv = a.find("div.title");
    let title = "";
    if (titleDiv.length > 0) {
      const span = titleDiv.find("span");
      title =
        span.length > 0 ? span.attr("data-title-default") || span.text().trim() : titleDiv.text().trim();
    }
    if (!title) title = img.attr("alt") || "";
    const score = a.find("span.kotakscore").text().replace(/\s/g, "").replace("⭐", "").trim();
    const slug = lastSegment(a.attr("href"));
    if (!slug || !title) return;
    out.push(
      makeItem("nontonanimeid", slug, {
        title,
        poster: img.attr("src") || "",
        type: "TV",
        status,
        score,
      }),
    );
  });
  return out;
}

function parseLatestEpisodes($: CheerioAPI): SourceItem[] {
  const out: SourceItem[] = [];
  $("#postbaru article.animeseries").each((_, el) => {
    const a = $(el).find("a").first();
    if (a.length === 0) return;
    const img = a.find("img");
    const span = a.find("h3.title span");
    let title = span.length > 0 ? span.attr("data-title-default") || span.text().trim() : "";
    if (!title) title = img.attr("alt") || "";
    const episode = a.find("span.types.episodes").text().trim();
    const status = a.find("span.types.status").text().trim();
    const slug = lastSegment(a.attr("href"));
    if (!slug || !title) return;
    out.push(
      makeItem("nontonanimeid", slug, {
        title,
        poster: img.attr("src") || "",
        type: "TV",
        status: status || "Ongoing",
        episodeLabel: episode || null,
      }),
    );
  });
  return out;
}

async function loadGenres(): Promise<SourceGenre[]> {
  return cached("nontonanimeid:genres", 60 * 60 * 1000, async () => {
    const { $ } = await load(`${baseUrl()}/genres/`, { sort: "az", mode: "sort" });
    const genres: SourceGenre[] = [];
    $("div.genre-grid-container a.genre-grid-card").each((_, el) => {
      const card = $(el);
      const slug = lastSegment(card.attr("href"));
      const name = card.find("h3.genre-name").text().trim();
      if (!slug || !name) return;
      genres.push({ id: slug, name, image: card.find("img").attr("src") || null });
    });
    return genres;
  });
}

const DAY_KEYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"] as const;
const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

export async function resolveNontonAnimeIdPlayer(
  ref: Extract<ServerRef, { kind: "nontonanimeid" }>,
): Promise<string> {
  const base = new URL(baseUrl());
  const ajaxUrl = ref.ajax || `${base.origin}/wp-admin/admin-ajax.php`;
  const target = assertPublicHttpUrl(ajaxUrl);
  if (target.host !== base.host) throw new Error("Endpoint player tidak cocok dengan sumber");

  const body = new URLSearchParams({
    action: "player_ajax",
    post: ref.post,
    nume: ref.nume,
    serverName: ref.name,
    nonce: ref.nonce,
  }).toString();

  const html = await fetchText(target.toString(), {
    source: "nontonanimeid",
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Origin: base.origin,
      Referer: ref.ref || base.origin,
    },
    timeoutMs: 10000,
  });
  const iframe = cheerio.load(html)("iframe").first();
  return iframe.attr("src") || iframe.attr("data-src") || "";
}

export const nontonanimeid: AnimeSource = {
  id: "nontonanimeid",
  label: "NontonAnimeID",

  async getHome() {
    const { $ } = await load(baseUrl());
    const feed: HomeFeed = {
      latest: parseLatestEpisodes($),
      popular: parseTab($, "tab-9", "Popular"),
      movies: parseTab($, "tab-7", "Completed").map((item) => ({ ...item, type: "Movie" })),
    };
    return feed;
  },

  async getLatest(page) {
    const url = page > 1 ? `${baseUrl()}/ongoing-list/page/${page}/` : `${baseUrl()}/ongoing-list/`;
    const { $ } = await load(url, { sort: "date", mode: "sort" });
    const items: SourceItem[] = [];
    $("div.gacha-grid a.gacha-card").each((_, el) => {
      const card = $(el);
      const img = card.find("img");
      const title = card.find("h3.title").text().trim() || img.attr("alt") || "";
      const slug = lastSegment(card.attr("href"));
      if (!slug || !title) return;
      items.push(
        makeItem("nontonanimeid", slug, {
          title,
          poster: img.attr("src") || "",
          type: "TV",
          status: "Ongoing",
          score: card.find("span.skor-angka").text().replace(/[()]/g, "").trim(),
          episodeLabel: card.find("span.current-ep").text().trim() || null,
        }),
      );
    });
    return { items, hasNext: items.length >= 20 };
  },

  async getPopular(page) {
    const url =
      page > 1 ? `${baseUrl()}/popular-series/page/${page}/` : `${baseUrl()}/popular-series/`;
    const { $ } = await load(url);
    const items: SourceItem[] = [];
    $("ul.rank li").each((_, el) => {
      const li = $(el);
      const a = li.find("a").first();
      const img = a.find("img");
      const mid = a.find("div.mid");
      const title = mid.find("h2").text().trim() || img.attr("alt") || "";
      const slug = lastSegment(a.attr("href"));
      if (!slug || !title) return;
      const genreText = mid.find("div.viewer").text().replace("Genre :", "").trim();
      items.push(
        makeItem("nontonanimeid", slug, {
          title,
          poster: img.attr("src") || "",
          type: "TV",
          synopsis: mid.find("p").text().trim() || null,
          genres: genreText
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
        }),
      );
    });
    return { items, hasNext: items.length >= 10 };
  },

  async search(keyword, page) {
    const url = page > 1 ? `${baseUrl()}/page/${page}/` : `${baseUrl()}/`;
    const { $ } = await load(url, { s: keyword });
    const items = parseGrid($);
    return { items, hasNext: items.length >= 20 };
  },

  getGenres: loadGenres,

  async getByGenre(genre, page): Promise<SourcePage> {
    const slug = slugify(genre);
    const url =
      page > 1 ? `${baseUrl()}/genres/${slug}/page/${page}/` : `${baseUrl()}/genres/${slug}/`;
    const { $ } = await load(url);
    const items: SourceItem[] = [];
    $("a.as-anime-card").each((_, el) => {
      items.push(...compact([cardItem(parseCard($, el))]));
    });
    return { items, hasNext: items.length >= 20 };
  },

  async getSchedule() {
    const { $ } = await load(`${baseUrl()}/jadwal-rilis/`);
    const schedule: Record<string, SourceItem[]> = {};
    for (const key of DAY_KEYS) {
      const label = DAY_LABELS[key];
      const items: SourceItem[] = [];
      $(`#${key} a.as-anime-card`).each((_, el) => {
        const card = $(el);
        const slug = lastSegment(card.attr("href"));
        const title = card.find("h3.as-anime-title").text().trim();
        if (!slug || !title) return;
        const genres: string[] = [];
        card.find("span.jr-genre-pill").each((__, g) => {
          genres.push($(g).text().trim());
        });
        items.push(
          makeItem("nontonanimeid", slug, {
            title,
            poster: card.find("img").attr("src") || "",
            type: card.find("span.jr-type-badge").text().trim() || "TV",
            status: "Ongoing",
            score: card.find("span.rating-text").text().replace("⭐", "").trim(),
            episodeLabel: card.find("span.jr-ep-text").text().trim() || null,
            day: label,
            genres,
          }),
        );
      });
      schedule[label] = items;
    }
    return schedule;
  },

  async getDetail(slug) {
    const url = slug.startsWith("http") ? slug : `${baseUrl()}/anime/${slug}/`;
    const { $ } = await load(url);

    const h1 = $("h1.entry-title");
    const h1Span = h1.find("span");
    const title =
      h1Span.length > 0
        ? h1Span.attr("data-title-default") || h1Span.text().trim()
        : h1.text().replace("Nonton", "").replace("Sub Indo", "").trim();
    if (!title) throw new Error(`Anime ${slug} tidak ditemukan`);

    const animeCard = $("div.anime-card");
    const sidebar = animeCard.find("div.anime-card__sidebar");
    const poster = sidebar.find("img").attr("src") || null;
    const score = sidebar.find("div.anime-card__score span.value").text().trim();
    const type = sidebar.find("div.anime-card__score span.type").text().trim();

    const details: Record<string, string> = {};
    animeCard.find("div.anime-card__main ul.details-list li").each((_, el) => {
      const li = $(el);
      const label = li.find("strong, span.detail-label").first();
      if (label.length === 0) return;
      const key = label.text().replace(":", "").trim();
      details[key] = li.text().replace(label.text(), "").replace(/^\s*:?\s*/, "").trim();
    });

    const genres: string[] = [];
    animeCard.find("div.anime-card__genres a").each((_, el) => {
      const name = $(el).text().trim();
      if (name) genres.push(name);
    });

    const synopsis = animeCard.find("div#tab-synopsis").text().trim();
    const status = $("div.anime-card__quick-info span[class*='status']").first().text().trim();
    let duration = "";
    $("div.anime-card__quick-info span.info-item").each((_, el) => {
      const text = $(el).text();
      if (text.includes("min") || text.includes("menit")) duration = text.trim();
    });

    const episodes: SourceEpisode[] = [];
    $("section.anime-card__episode-list-section div.episode-list-items a.episode-item").each(
      (idx, el) => {
        const a = $(el);
        const epSlug = lastSegment(a.attr("href"));
        if (!epSlug) return;
        const epTitle = a.find("span.ep-title").text().trim();
        episodes.push({
          id: toEpisodeId("nontonanimeid", epSlug),
          number: episodeNumberFrom(epTitle || epSlug, idx + 1),
          title: epTitle || `Episode ${idx + 1}`,
          date: a.find("span.ep-date").text().trim() || null,
        });
      },
    );
    episodes.sort((a, b) => a.number - b.number);

    const recommended: SourceItem[] = [];
    $("div.related a.as-anime-card").each((_, el) => {
      recommended.push(...compact([cardItem(parseCard($, el))]));
    });

    const detail: SourceDetail = {
      id: toAnimeId("nontonanimeid", lastSegment(url)),
      source: "nontonanimeid",
      title,
      japanese: details["Japanese"] || details["Judul Alternatif"] || null,
      poster,
      cover: poster,
      synopsis: synopsis || null,
      status: status || null,
      type: type || null,
      score: score || null,
      genres,
      studio: details["Studio"] || null,
      producers: details["Produser"] || details["Producers"] || null,
      duration: duration || details["Durasi"] || null,
      aired: details["Tayang"] || details["Aired"] || null,
      year: null,
      episodes,
      recommended,
    };
    return detail;
  },

  async getStream(slug) {
    const url = slug.startsWith("http") ? slug : `${baseUrl()}/${slug}/`;
    const { $, nonce, ajax } = await load(url);

    const title = $("h1.entry-title").text().trim();
    if (!title) throw new Error(`Episode ${slug} tidak ditemukan`);

    const crumbs = $("nav.breadcrumbs a").filter((_, el) => Boolean($(el).attr("href")));
    const animeLink = crumbs.length >= 2 ? crumbs.last().attr("href") || "" : "";

    let prev = "";
    let next = "";
    $("div.naveps div.nvs a").each((_, el) => {
      const href = $(el).attr("href") || "";
      const label = $(el).text().toLowerCase();
      if (label.includes("prev")) prev = href;
      else if (label.includes("next")) next = href;
    });

    const servers: SourceServer[] = [];
    const defaultUrl = $("div#videoku iframe").first().attr("src") || $("div#videoku iframe").first().attr("data-src") || "";
    let activeName = "";
    const lazy: { name: string; post: string; nume: string }[] = [];
    $("ul.player li.serverplayer").each((_, el) => {
      const li = $(el);
      const name = li.text().trim();
      const post = li.attr("data-post") || "";
      const nume = li.attr("data-nume") || "";
      if (li.hasClass("on")) activeName = name;
      else if (name && post && nume) lazy.push({ name, post, nume });
    });

    if (defaultUrl) {
      servers.push({
        name: activeName || "Server Utama",
        quality: "Auto",
        ref: { kind: "url", url: defaultUrl },
      });
    }
    if (nonce) {
      for (const s of lazy) {
        servers.push({
          name: s.name,
          quality: "Auto",
          ref: {
            kind: "nontonanimeid",
            post: s.post,
            nume: s.nume,
            name: s.name,
            nonce,
            ajax: ajax || "",
            ref: url,
          },
        });
      }
    }

    const downloads: DownloadQualityGroup[] = [];
    $("div#download_area div#arealinker div.listlink").each((_, el) => {
      const box = $(el);
      const urls: { title: string; url: string }[] = [];
      box.find("a").each((__, a) => {
        const href = $(a).attr("href") || "";
        if (href) urls.push({ title: cleanText($(a).text()) || "Unduh", url: absUrl(baseUrl(), href) });
      });
      if (urls.length > 0) {
        downloads.push({ quality: box.find("span").first().text().trim() || "Unduhan", size: null, urls });
      }
    });

    const animeSlug = lastSegment(animeLink);
    const stream: SourceStream = {
      id: toEpisodeId("nontonanimeid", lastSegment(url)),
      animeId: animeSlug ? toAnimeId("nontonanimeid", animeSlug) : "",
      title,
      releaseTime: null,
      servers,
      downloads,
      prevEpisodeId: prev ? toEpisodeId("nontonanimeid", lastSegment(prev)) : null,
      nextEpisodeId: next ? toEpisodeId("nontonanimeid", lastSegment(next)) : null,
    };
    return stream;
  },
};
