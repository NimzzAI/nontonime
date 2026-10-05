import { cleanText } from "./http.server";
import type { SourceId, SourceItem } from "./types";

export const SOURCE_PREFIX: Record<SourceId, string> = {
  animein: "ai",
  nontonanimeid: "na",
  gomunime: "gm",
  aniwatch: "aw",
  stucknime: "stk",
  samehadaku: "sh",
};

const PREFIX_TO_SOURCE: Record<string, SourceId> = {
  ai: "animein",
  na: "nontonanimeid",
  gm: "gomunime",
  aw: "aniwatch",
  stk: "stucknime",
  sh: "samehadaku",
};

export function toAnimeId(source: SourceId, slug: string): string {
  return `${SOURCE_PREFIX[source]}_${slug}`;
}

export function toEpisodeId(source: SourceId, slug: string): string {
  return `${SOURCE_PREFIX[source]}_ep_${slug}`;
}

export interface ParsedId {
  source: SourceId;
  slug: string;
  kind: "anime" | "episode";
}

export function parseId(id: string): ParsedId | null {
  const match = id.match(/^(ai|na|gm|aw|stk|sh)_(ep_)?(.+)$/);
  if (!match) return null;
  const source = PREFIX_TO_SOURCE[match[1] ?? ""];
  const slug = match[3];
  if (!source || !slug) return null;
  return { source, slug, kind: match[2] ? "episode" : "anime" };
}

export function formatScore(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) return null;
  return typeof value === "number" ? String(Math.round(num * 100) / 100) : String(num);
}

export interface ItemInit {
  title: string;
  poster?: string | null | undefined;
  cover?: string | null | undefined;
  type?: string | null | undefined;
  status?: string | null | undefined;
  score?: string | number | null | undefined;
  year?: string | number | null | undefined;
  genres?: string[] | undefined;
  synopsis?: string | null | undefined;
  episodeLabel?: string | null | undefined;
  day?: string | null | undefined;
  views?: number | null | undefined;
}

export function makeItem(source: SourceId, slug: string, init: ItemInit): SourceItem {
  const poster = init.poster || init.cover || null;
  return {
    id: toAnimeId(source, slug),
    source,
    title: cleanText(init.title),
    poster,
    cover: init.cover || poster,
    type: init.type || null,
    status: init.status || null,
    score: formatScore(init.score),
    year: init.year !== null && init.year !== undefined ? String(init.year) : null,
    genres: init.genres ?? [],
    synopsis: init.synopsis || null,
    episodeLabel: init.episodeLabel || null,
    day: init.day || null,
    views: init.views ?? null,
  };
}

// Judul dinormalkan supaya anime yang sama dari beberapa sumber bisa digabung
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(sub(title)?\s*indo(nesia)?|nonton|streaming|season|musim)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
