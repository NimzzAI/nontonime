import * as cheerio from "cheerio";
import { cached } from "./cache.server";
import { cleanText, fetchText, lastSegment } from "./http.server";
import { normalizeTitle } from "./ids";
import type { BatchDetail } from "../anime-types";

const DEFAULT_BASE = "https://kusonime.com";

function baseUrl(): string {
  return DEFAULT_BASE;
}

async function html(url: string): Promise<string> {
  return fetchText(url, { source: "kusonime", timeoutMs: 10000 });
}

export interface BatchHit {
  title: string;
  slug: string;
  poster: string | null;
}

export async function searchBatch(query: string): Promise<BatchHit[]> {
  const $ = cheerio.load(await html(`${baseUrl()}/?s=${encodeURIComponent(query)}`));
  const hits: BatchHit[] = [];
  $(".venz > ul > .kover, .venz > .kover").each((_, el) => {
    const item = $(el);
    const link = item.find(".content h2 a, h2.episodeye a").first();
    const title = cleanText(link.text());
    const slug = lastSegment(link.attr("href"));
    if (!title || !slug) return;
    const img = item.find(".thumb img");
    hits.push({
      title,
      slug,
      poster: img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || null,
    });
  });
  return hits;
}

// Mencari batch yang judulnya cocok dengan judul anime, kalau tidak ada yang cocok hasilnya null
export async function findBatchFor(title: string): Promise<BatchHit | null> {
  const wanted = normalizeTitle(title);
  if (!wanted) return null;
  return cached(`kusonime:find:${wanted}`, 6 * 60 * 60 * 1000, async () => {
    const hits = await searchBatch(title);
    const match = hits.find((hit) => {
      const found = normalizeTitle(hit.title);
      return found.includes(wanted) || wanted.includes(found);
    });
    return match ?? null;
  });
}

export async function getBatchDetail(slug: string): Promise<BatchDetail | null> {
  const clean = lastSegment(slug);
  if (!clean) return null;
  const $ = cheerio.load(await html(`${baseUrl()}/${clean}/`));

  const title = cleanText($("h1.jdlz").text() || $("h1.entry-title").text());
  if (!title) return null;
  const poster =
    $(".post-thumb img.wp-post-image").attr("src") ||
    $(".post-thumb img").attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    null;

  const formats: BatchDetail["downloadUrl"]["formats"] = [];
  $(".smokeddl, .smokeddlrh").each((_, boxEl) => {
    const box = $(boxEl);
    const formatTitle = cleanText(box.find(".smokettl, .smokettlrh").text());
    if (!formatTitle) return;

    const qualities: BatchDetail["downloadUrl"]["formats"][number]["qualities"] = [];
    box.find(".smokeurl, .smokeurlrh").each((__, resEl) => {
      const res = $(resEl);
      const resolution = cleanText(res.find("strong, b").text());
      if (!resolution) return;
      const urls: { title: string; url: string }[] = [];
      res.find("a").each((___, a) => {
        const url = $(a).attr("href") || "";
        const provider = cleanText($(a).text());
        if (url.startsWith("http") && provider) urls.push({ title: provider, url });
      });
      if (urls.length > 0) qualities.push({ title: resolution, size: "", urls });
    });
    if (qualities.length > 0) formats.push({ title: formatTitle, qualities });
  });

  return { title, animeId: "", poster, downloadUrl: { formats } };
}
