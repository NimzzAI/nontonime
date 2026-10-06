import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI, Element } from "cheerio";
import {
  SourceError,
  absUrl,
  cleanText,
  episodeNumberFrom,
  fetchText,
  lastSegment,
  parseNumber,
} from "./http.server";
import { makeItem, toAnimeId, toEpisodeId } from "./ids";
import { assertPublicHttpUrl } from "./token.server";
import type { DownloadQualityGroup } from "../anime-types";
import type {
  AnimeSource,
  HomeFeed,
  ServerRef,
  SourceDetail,
  SourceEpisode,
  SourceItem,
  SourcePage,
  SourceServer,
  SourceStream,
} from "./types";

const DEFAULT_DOMAINS = ["https://samehadaku.me", "https://samehadaku.io"];

let activeBase: string | null = null;

function domains(): string[] {
  return DEFAULT_DOMAINS;
}

function currentBase(): string {
  const [first] = domains();
  return activeBase ?? first ?? "";
}

function toUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path.replace(/^https?:\/\/[^/]+/i, base);
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Domain pertama dicoba lebih dulu, kalau gagal domain cadangan dipakai dan diingat
async function html(path: string): Promise<string> {
  const first = currentBase();
  const order = [first, ...domains().filter((d) => d !== first)];
  let last: unknown = null;
  for (const base of order) {
    try {
      const text = await fetchText(toUrl(base, path), {
        source: "samehadaku",
        headers: { Referer: `${base}/` },
        timeoutMs: 9000,
      });
      activeBase = base;
      return text;
    } catch (error) {
      last = error;
      if (error instanceof SourceError && error.status === 404) throw error;
    }
  }
  throw last instanceof Error ? last : new Error("Samehadaku tidak bisa dihubungi");
}

// Item di beranda sering menaut ke halaman episode, jadi slug episode dipotong jadi slug anime
function animeSlugFrom(href: string | null | undefined): string {
  return lastSegment(href).replace(/-episode-\d.*$/i, "");
}

function imgOf(node: Cheerio<Element>): string {
  const img = node.find("img").first();
  return img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
}

function cardTitle($el: Cheerio<Element>): string {
  const text = $el.find(".data .title h2, .title h2, h2, .title, .entry-title").first().text();
  return cleanText(text) || cleanText($el.find("a").first().attr("title"));
}

function parseCards(
  $: CheerioAPI,
  selector: string,
  extra: { status?: string; type?: string } = {},
): SourceItem[] {
  const items: SourceItem[] = [];
  const seen = new Set<string>();
  $(selector).each((_, el) => {
    const card = $(el);
    const slug = animeSlugFrom(card.find("a").first().attr("href"));
    const title = cardTitle(card);
    if (!slug || !title || seen.has(slug)) return;
    seen.add(slug);
    const episode = cleanText(card.find(".bt .epx, .epx, .ep").first().text());
    items.push(
      makeItem("samehadaku", slug, {
        title,
        poster: imgOf(card),
        type: cleanText(card.find(".typez, .type").first().text()) || extra.type || "TV",
        status: extra.status ?? null,
        score: parseNumber(card.find(".numscore, .score, .rating").first().text()),
        episodeLabel: episode || null,
      }),
    );
  });
  return items;
}

export async function resolveSamehadakuPlayer(
  ref: Extract<ServerRef, { kind: "samehadaku" }>,
): Promise<string> {
  const base = currentBase();
  const target = assertPublicHttpUrl(`${base}/wp-admin/admin-ajax.php`);
  const body = new URLSearchParams({
    action: "player_ajax",
    post: ref.post,
    nume: ref.nume,
    type: ref.type,
  }).toString();

  const text = await fetchText(target.toString(), {
    source: "samehadaku",
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Origin: base,
      Referer: ref.ref || `${base}/`,
    },
    timeoutMs: 9000,
  });
  const iframe = cheerio.load(text)("iframe").first();
  return iframe.attr("src") || iframe.attr("data-src") || "";
}

export const samehadaku: AnimeSource = {
  id: "samehadaku",
  label: "Samehadaku",

  async getHome() {
    const $ = cheerio.load(await html(currentBase()));

    const popular: SourceItem[] = [];
    $(".popseries li, .serieslist li")
      .slice(0, 10)
      .each((_, el) => {
        const li = $(el);
        const a = li.find("a").first();
        const slug = animeSlugFrom(a.attr("href"));
        const title =
          cleanText(li.find(".leftseries h4, .title").first().text()) || cleanText(a.attr("title"));
        if (!slug || !title) return;
        popular.push(
          makeItem("samehadaku", slug, {
            title,
            poster: imgOf(li),
            type: cleanText(li.find(".typez, .type").first().text()) || "TV",
            status: "Popular",
            score: parseNumber(li.find(".numscore, .score, .rating").first().text()),
          }),
        );
      });

    const feed: HomeFeed = {
      latest: parseCards($, ".post-show li, .listupd article, .animposx", { status: "Ongoing" }),
      popular,
    };

    const movies: SourceItem[] = [];
    $("h3:contains('Movie'), .widgettitle:contains('Movie')")
      .closest(".bixbox, .widget")
      .find("article, li, .animposx")
      .each((_, el) => {
        const card = $(el);
        const slug = animeSlugFrom(card.find("a").first().attr("href"));
        const title = cardTitle(card);
        if (!slug || !title) return;
        movies.push(
          makeItem("samehadaku", slug, {
            title,
            poster: imgOf(card),
            type: "Movie",
            status: "Completed",
            score: parseNumber(card.find(".numscore, .score, .rating").first().text()),
          }),
        );
      });
    if (movies.length > 0) feed.movies = movies;
    return feed;
  },

  async search(keyword, page): Promise<SourcePage> {
    const q = encodeURIComponent(keyword);
    const path = page > 1 ? `/page/${page}/?s=${q}` : `/?s=${q}`;
    const $ = cheerio.load(await html(path));
    const items = parseCards($, ".animpost, .listupd article");
    return { items, hasNext: items.length >= 10 };
  },

  async getDetail(slug) {
    const clean = lastSegment(slug);
    const $ = cheerio.load(await html(`/anime/${clean}/`));

    const title = cleanText($("h1.titless, .animetitle-episode, h1").first().text()).replace(
      /^(Tonton|Watch|Streaming|List Episode)\s+/i,
      "",
    );
    if (!title) throw new Error(`Anime ${clean} tidak ditemukan`);

    let rawPoster =
      $("img[class*='anmsa'], img[itemprop='image'], .thumb img, .areaimg img")
        .first()
        .attr("src") || null;
    if (rawPoster && (rawPoster.toLowerCase().includes("logo") || rawPoster.startsWith("data:"))) {
      rawPoster = `/api/image-proxy?title=${encodeURIComponent(title)}`;
    }
    const poster = rawPoster || `/api/image-proxy?title=${encodeURIComponent(title)}`;
    const synopsis = cleanText(
      $(".series-synopsis, .desc, .sinopsis, .entry-content").first().text(),
    );

    const info: Record<string, string> = {};
    $(".infox .spe span, .spe span, .seriestuinfo span").each((_, el) => {
      const text = $(el).text().trim();
      const at = text.indexOf(":");
      if (at < 0) return;
      info[text.slice(0, at).trim().toLowerCase()] = text.slice(at + 1).trim();
    });
    const pick = (...keys: string[]): string | null => {
      for (const key of keys) {
        const value = info[key];
        if (value) return value;
      }
      return null;
    };

    const genres: string[] = [];
    $("a[href*='genre'], .seriestugenre a").each((_, el) => {
      const name = cleanText($(el).text());
      if (name && !genres.includes(name)) genres.push(name);
    });

    const episodes: SourceEpisode[] = [];
    const seen = new Set<string>();
    $(".eplister ul li a, a[href*='-episode-']").each((idx, el) => {
      const href = $(el).attr("href") || "";
      const epSlug = lastSegment(href);
      if (!epSlug || seen.has(epSlug) || !/episode/i.test(href)) return;
      seen.add(epSlug);
      const label = cleanText($(el).text());
      const number = episodeNumberFrom(label || epSlug, idx + 1);
      episodes.push({
        id: toEpisodeId("samehadaku", epSlug),
        number,
        title: label || `Episode ${number}`,
        date: null,
      });
    });
    episodes.sort((a, b) => a.number - b.number);

    const recommended = parseCards($, ".rand-animesu li, .relat article");

    const detail: SourceDetail = {
      id: toAnimeId("samehadaku", clean),
      source: "samehadaku",
      title,
      japanese: pick("japanese", "alternatif", "synonyms"),
      poster,
      cover: poster,
      synopsis: synopsis || null,
      status: pick("status"),
      type: pick("type", "tipe"),
      score: null,
      genres,
      studio: pick("studio"),
      producers: pick("producers", "produser"),
      duration: pick("duration", "durasi"),
      aired: pick("released", "rilis", "aired"),
      year: null,
      episodes,
      recommended,
    };
    return detail;
  },

  async getStream(slug) {
    const clean = lastSegment(slug);
    const pageUrl = toUrl(currentBase(), `/${clean}/`);
    const $ = cheerio.load(await html(`/${clean}/`));

    const title = cleanText($("h1").first().text());
    if (!title) throw new Error(`Episode ${clean} tidak ditemukan`);

    const animeLink =
      $("a")
        .filter((_, el) => cleanText($(el).text()) === "All Episode")
        .first()
        .attr("href") || "";

    const servers: SourceServer[] = [];
    $(
      "iframe.embed-embed, .mirrorifram iframe, iframe[src*='embed'], iframe[src*='player'], iframe[src*='blogger']",
    ).each((idx, el) => {
      const src = absUrl(currentBase(), $(el).attr("src"));
      if (!src || servers.some((s) => s.ref.kind === "url" && s.ref.url === src)) return;
      servers.push({ name: `Server ${idx + 1}`, quality: "Auto", ref: { kind: "url", url: src } });
    });

    $(".east_player_option").each((idx, el) => {
      const option = $(el);
      const post = option.attr("data-post") || "";
      const nume = option.attr("data-nume") || "";
      const type = option.attr("data-type") || "";
      if (!post || !nume) return;
      servers.push({
        name:
          cleanText(option.find("span").text()) || cleanText(option.text()) || `Player ${idx + 1}`,
        quality: "Auto",
        ref: { kind: "samehadaku", post, nume, type, ref: pageUrl },
      });
    });

    const downloads: DownloadQualityGroup[] = [];
    $(".download-eps").each((_, box) => {
      const format = cleanText($(box).find("p b").text()) || "Unduhan";
      $(box)
        .find("ul li")
        .each((__, li) => {
          const quality = cleanText($(li).find("strong").text());
          if (!quality) return;
          const urls: { title: string; url: string }[] = [];
          $(li)
            .find("span a")
            .each((___, a) => {
              const url = $(a).attr("href") || "";
              if (url) urls.push({ title: cleanText($(a).text()) || "Unduh", url });
            });
          if (urls.length > 0)
            downloads.push({ quality: `${format} ${quality}`.trim(), size: null, urls });
        });
    });

    const animeSlug = animeSlugFrom(animeLink) || animeSlugFrom(clean);
    const stream: SourceStream = {
      id: toEpisodeId("samehadaku", clean),
      animeId: animeSlug ? toAnimeId("samehadaku", animeSlug) : "",
      title,
      releaseTime: null,
      servers,
      downloads,
      prevEpisodeId: null,
      nextEpisodeId: null,
    };
    return stream;
  },
};
