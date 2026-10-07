import type {
  AnimeDetail,
  AnimeSummary,
  BatchDetail,
  DirectoryGroup,
  GenreItem,
  HomeSections,
  ListResult,
  QualityServerGroup,
  ScheduleMap,
  StreamResult,
} from "./anime-types";
import { SCHEDULE_DAYS } from "./anime-types";
import { cached, withTimeout } from "./sources/cache.server";
import { BROWSER_UA, fetchText, isDirectMediaUrl, slugify } from "./sources/http.server";
import { normalizeTitle, parseId } from "./sources/ids";
import { findBatchFor, getBatchDetail, searchBatch } from "./sources/kusonime.server";
import { resolveNontonAnimeIdPlayer } from "./sources/nontonanimeid.server";
import { enabledSources, getSource } from "./sources/registry.server";
import { animein } from "./sources/animein.server";
import { resolveSamehadakuPlayer } from "./sources/samehadaku.server";
import { assertPublicHttpUrl, decodeServerRef, encodeServerRef } from "./sources/token.server";
import { formatSafePoster } from "./sources/poster.server";
import {
  getSearchQueryTerms,
  resolveAnimeAliases,
  type AnimeAliasData,
} from "./sources/alias.server";
import type {
  AnimeSource,
  HomeFeed,
  SourceId,
  SourceItem,
  SourcePage,
  SourceStream,
} from "./sources/types";

const MIN = 60 * 1000;
const SOURCE_TIMEOUT_MS = 14000;
const DETAIL_TIMEOUT_MS = 25000;

/* ========================================================================== */
/*                                  HELPERS                                   */
/* ========================================================================== */

function toSummary(item: SourceItem): AnimeSummary {
  const poster = formatSafePoster(item.poster, item.title);
  const cover = formatSafePoster(item.cover || item.poster, item.title);

  // Accurate status normalization for old vs ongoing anime
  let normalizedStatus = item.status;
  const currentYear = new Date().getFullYear();
  const yearNum = item.year ? parseInt(item.year, 10) : null;
  const isPastYear = yearNum !== null && yearNum > 1900 && yearNum < currentYear;

  if (normalizedStatus && /tamat|complete|finish|selesai|ended/i.test(normalizedStatus)) {
    normalizedStatus = "Completed";
  } else if (isPastYear && (!normalizedStatus || !/ongoing|tayang/i.test(normalizedStatus))) {
    // Anime from past years that are not actively airing are Completed
    normalizedStatus = "Completed";
  } else if (item.type === "Movie" && (!normalizedStatus || isPastYear)) {
    normalizedStatus = "Completed";
  }

  // Only assign active broadcast day if the anime is not completed
  const activeDay = isPastYear || normalizedStatus === "Completed" ? null : item.day;

  return {
    id: item.id,
    title: item.title,
    poster,
    cover,
    score: item.score,
    status: normalizedStatus,
    type: item.type ?? "TV",
    genres: item.genres,
    synopsis: item.synopsis,
    year: item.year,
    views: item.views,
    day: activeDay,
    releaseDay: activeDay,
    latestReleaseDate: item.episodeLabel,
    episodeCount: null,
  };
}

interface SourceResult<T> {
  source: SourceId;
  value: T;
}

// Semua sumber dipanggil bersamaan, yang gagal atau terlalu lama dilewati tanpa merusak hasil lain
async function fromSources<T>(
  label: string,
  pick: (source: AnimeSource) => Promise<T> | undefined,
): Promise<{ results: SourceResult<T>[]; attempted: number }> {
  const calls: { source: AnimeSource; promise: Promise<T> }[] = [];
  for (const source of enabledSources()) {
    const promise = pick(source);
    if (promise) {
      calls.push({
        source,
        promise: withTimeout(promise, SOURCE_TIMEOUT_MS, `${source.id}.${label}`),
      });
    }
  }
  const settled = await Promise.allSettled(calls.map((c) => c.promise));
  const results: SourceResult<T>[] = [];
  settled.forEach((res, i) => {
    const call = calls[i];
    if (!call) return;
    if (res.status === "fulfilled") {
      results.push({ source: call.source.id, value: res.value });
    } else {
      const reason = res.reason instanceof Error ? res.reason.message : String(res.reason);
      if (!reason.includes("403")) {
        console.warn(`[sources] ${call.source.id}.${label} gagal: ${reason}`);
      }
    }
  });
  return { results, attempted: calls.length };
}

// Hasil tiap sumber diselang-seling supaya satu sumber tidak menguasai daftar, judul kembar dibuang
function mergeItems(lists: SourceItem[][], limit?: number): SourceItem[] {
  const seen = new Set<string>();
  const out: SourceItem[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const item = list[i];
      if (!item) continue;
      const key = normalizeTitle(item.title) || item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (limit && out.length >= limit) return out;
    }
  }
  return out;
}

function mergePages(results: SourceResult<SourcePage>[], page: number): ListResult {
  const items = mergeItems(results.map((r) => r.value.items)).map(toSummary);
  const hasNext = results.some((r) => r.value.hasNext);
  return {
    items,
    page,
    hasNext,
    totalPages: hasNext ? page + 1 : page,
    pagination: null,
  };
}

function requireResults<T>(
  results: SourceResult<T>[],
  attempted: number,
  label: string,
): SourceResult<T>[] {
  if (results.length === 0 && attempted > 0) {
    throw new Error(`Semua sumber anime gagal dihubungi saat memuat ${label}`);
  }
  return results;
}

function titleCaseDay(value: string): string {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function relevance(
  title: string,
  itemId: string,
  query: string,
  aliasData?: AnimeAliasData | null,
): number {
  const t = title.toLowerCase();
  const q = query.toLowerCase().trim();
  let baseScore = 0;
  if (t === q) baseScore = 1000;
  else if (t.startsWith(q)) baseScore = 500;
  else if (t.includes(q)) baseScore = 300;

  // Title alias handling (e.g. Yuru Camp <-> Laid-Back Camp <-> ゆるキャン)
  let aliasBonus = 0;
  if (aliasData) {
    if (aliasData.romaji) {
      const romaji = aliasData.romaji
        .toLowerCase()
        .replace(/[△▲★☆]/g, " ")
        .trim();
      if (t === romaji) aliasBonus = Math.max(aliasBonus, 900);
      else if (t.startsWith(romaji)) aliasBonus = Math.max(aliasBonus, 500);
      else if (t.includes(romaji)) aliasBonus = Math.max(aliasBonus, 300);
    }
    if (aliasData.english) {
      const english = aliasData.english.toLowerCase();
      if (t === english) aliasBonus = Math.max(aliasBonus, 850);
      else if (t.startsWith(english)) aliasBonus = Math.max(aliasBonus, 450);
      else if (t.includes(english)) aliasBonus = Math.max(aliasBonus, 250);
    }
    if (aliasData.native) {
      const native = aliasData.native
        .toLowerCase()
        .replace(/[△▲★☆]/g, " ")
        .trim();
      if (t === native || q === native) aliasBonus = Math.max(aliasBonus, 900);
      else if (t.includes(native) || q.includes(native)) aliasBonus = Math.max(aliasBonus, 350);
    }
    for (const syn of aliasData.synonyms) {
      const synLower = syn.toLowerCase();
      if (t.includes(synLower)) aliasBonus = Math.max(aliasBonus, 200);
    }
  }

  const words = q.split(/\s+/).filter(Boolean);
  const hits = words.filter((w) => t.includes(w)).length;

  // Sub Indo priority boost for Indonesian viewers
  const isSubIndo = !itemId.startsWith("aw_");
  const subIndoBonus = isSubIndo ? 150 : 0;

  // Detect season numbers (e.g. "season 2", "s2", "2")
  const qSeasonMatch = q.match(/\b(?:season\s*|s)?(\d+)\b/);
  let seasonBonus = 0;
  if (qSeasonMatch) {
    const sNum = qSeasonMatch[1];
    const matchesTargetSeason =
      t.includes(`season ${sNum}`) ||
      t.includes(`season${sNum}`) ||
      t.includes(`s${sNum}`) ||
      t.includes(` ${sNum}`);

    if (matchesTargetSeason) {
      seasonBonus = 600; // Strong boost for targeted season!
    } else {
      // If user specifically asked for season 2, but this item has "season 3", penalize slightly
      const otherSeason = t.match(/\b(?:season\s*|s)(\d+)\b/);
      if (otherSeason && otherSeason[1] !== sNum) {
        seasonBonus = -200;
      }
    }
  }

  return (
    baseScore +
    aliasBonus +
    subIndoBonus +
    seasonBonus +
    hits * 10 -
    Math.abs(t.length - q.length) / 100
  );
}

/* ========================================================================== */
/*                                HOME SECTIONS                               */
/* ========================================================================== */

const EMPTY_HOME: HomeSections = {
  slider: [],
  today: [],
  hot: [],
  popular: [],
  new: [],
  waiting: [],
};

// Beranda tiap sumber disimpan sendiri, dipakai ulang oleh beranda, terbaru, dan populer
async function sourceHome(source: AnimeSource, day: string | null): Promise<HomeFeed> {
  const key = `srchome:${source.id}:${source.homeUsesDay ? (day ?? "") : ""}`;
  return cached(key, 5 * MIN, async () => (source.getHome ? source.getHome(day) : {}));
}

// Daftar pertama yang terisi dipakai, jadi sumber tanpa bagian tertentu tetap ikut lewat daftar lain
function pool(feeds: HomeFeed[], ...keys: (keyof HomeFeed)[]): SourceItem[][] {
  return feeds.map((feed) => {
    for (const key of keys) {
      const list = feed[key];
      if (list && list.length > 0) return list;
    }
    return [];
  });
}

export async function getHome(
  dayFilter?: string | null,
  _provider = "otakudesu",
): Promise<HomeSections> {
  const day = dayFilter ? dayFilter.trim() : null;
  try {
    return await cached(`home:${day ?? "default"}`, 5 * MIN, async () => {
      const { results, attempted } = await fromSources<HomeFeed>("home", (s) =>
        s.getHome ? sourceHome(s, day) : undefined,
      );
      requireResults(results, attempted, "beranda");
      const feeds = results.map((r) => r.value);

      const rawLatest = mergeItems(pool(feeds, "latest", "today")).map(toSummary);
      const rawPopular = mergeItems(pool(feeds, "popular", "hot", "latest")).map(toSummary);
      const rawHot = mergeItems(pool(feeds, "hot", "popular", "latest")).map(toSummary);
      const rawSlider = mergeItems(pool(feeds, "slider", "hot", "popular", "latest")).map(
        toSummary,
      );
      const rawToday = mergeItems(day ? pool(feeds, "today") : pool(feeds, "today", "latest")).map(
        toSummary,
      );
      const rawWaiting = mergeItems(pool(feeds, "waiting", "movies")).map(toSummary);

      const isCompleted = (item: AnimeSummary) =>
        item.status === "Completed" ||
        /tamat|complete|finish|selesai|ended/i.test(item.status ?? "");

      // 1. Sedang Tayang (Ongoing): STRICTLY ongoing! Filter out any completed series
      const ongoingItems = rawHot.filter((item) => !isCompleted(item));

      // 2. Tayang Hari Ini: STRICTLY ongoing broadcast series
      const todayItems = rawToday.filter((item) => !isCompleted(item));

      // 3. Episode Terbaru (Baru Rilis): fresh ongoing releases / latest episodes, never old completed series
      const freshNewItems = rawLatest.filter((item) => !isCompleted(item));

      // 4. Anime Tamat (Completed): STRICTLY completed anime
      const completedItems = rawPopular.filter(isCompleted);
      if (completedItems.length < 10) {
        const poolCompleted = [...rawHot, ...rawLatest, ...rawSlider].filter(isCompleted);
        const seen = new Set(completedItems.map((c) => c.id));
        for (const c of poolCompleted) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            completedItems.push(c);
          }
        }
      }

      const home: HomeSections = {
        slider: rawSlider.slice(0, 8),
        today: (todayItems.length > 0 ? todayItems : freshNewItems).slice(0, 18),
        hot: ongoingItems.slice(0, 10),
        popular: completedItems.slice(0, 12),
        new: freshNewItems.slice(0, 18),
        waiting: (rawWaiting.length > 0 ? rawWaiting : completedItems.slice(6)).slice(0, 10),
      };
      return home;
    });
  } catch (error) {
    console.error("Error in getHome:", error);
    return EMPTY_HOME;
  }
}

/* ========================================================================== */
/*                             LATEST AND COMPLETED                           */
/* ========================================================================== */

// Sumber tanpa daftar bertingkat hanya ikut di halaman pertama lewat berandanya
async function pageFromHome(source: AnimeSource, keys: (keyof HomeFeed)[]): Promise<SourcePage> {
  if (!source.getHome) return { items: [], hasNext: false };
  const feed = await sourceHome(source, null);
  for (const key of keys) {
    const list = feed[key];
    if (list && list.length > 0) return { items: list, hasNext: false };
  }
  return { items: [], hasNext: false };
}

export async function getLatest(page = 1, _provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);
  return cached(`latest:${safePage}`, 5 * MIN, async () => {
    const { results, attempted } = await fromSources<SourcePage>("latest", (s) =>
      s.getLatest
        ? s.getLatest(safePage)
        : safePage === 1
          ? pageFromHome(s, ["latest"])
          : undefined,
    );
    return mergePages(requireResults(results, attempted, "daftar terbaru"), safePage);
  });
}

export async function getPopular(page = 1, _provider = "otakudesu"): Promise<ListResult> {
  const safePage = Math.max(1, page);
  return cached(`popular:${safePage}`, 10 * MIN, async () => {
    const { results, attempted } = await fromSources<SourcePage>("popular", (s) =>
      s.getPopular
        ? s.getPopular(safePage)
        : safePage === 1
          ? pageFromHome(s, ["popular", "hot"])
          : undefined,
    );
    return mergePages(requireResults(results, attempted, "daftar populer"), safePage);
  });
}

const COMPLETED_PATTERN = /tamat|complete|finish|selesai/i;

// Sumber tidak punya daftar tamat sendiri, jadi daftar populer disaring lewat status
export async function getCompleted(page = 1, provider = "otakudesu"): Promise<ListResult> {
  const popular = await getPopular(page, provider);
  const done = popular.items.filter((item) => COMPLETED_PATTERN.test(item.status ?? ""));
  if (done.length === 0) return popular;
  return { ...popular, items: done.map((item) => ({ ...item, status: "Completed" })) };
}

/* ========================================================================== */
/*                                   SEARCH                                   */
/* ========================================================================== */

export async function search(
  keyword: string,
  page = 1,
  _provider = "otakudesu",
): Promise<ListResult> {
  const term = keyword.trim();
  if (!term) return { items: [], page: 1, hasNext: false };
  const safePage = Math.max(1, page);

  // 1. Direct URL / ID check (e.g. https://aniwatch.cx/episode/yuruyuri-nachuyachumi-1-c5d95)
  const parsed = parseId(term);
  if (parsed && safePage === 1) {
    try {
      if (parsed.kind === "episode") {
        const stream = await getSource(parsed.source).getStream(parsed.slug);
        if (stream) {
          const item: AnimeSummary = {
            id: stream.animeId || toEpisodeId(parsed.source, parsed.slug),
            title: stream.title,
            poster: null,
            type: "Episode",
            status: "Ongoing",
          };
          // Try fetching parent anime detail for rich poster
          if (stream.animeId) {
            try {
              const cleanOwner = stream.animeId.replace(/^[a-z]+_/, "");
              const parentDetail = await getSource(parsed.source).getDetail(cleanOwner);
              if (parentDetail) {
                return { items: [toSummary(parentDetail)], page: 1, hasNext: false };
              }
            } catch {
              // ignore detail lookup error
            }
          }
          return { items: [item], page: 1, hasNext: false };
        }
      } else if (parsed.kind === "anime") {
        const detail = await getSource(parsed.source).getDetail(parsed.slug);
        if (detail) {
          return { items: [toSummary(detail)], page: 1, hasNext: false };
        }
      }
    } catch {
      // ignore URL resolution error
    }
  }

  // 2. Clean query if a URL was pasted
  const cleanTerm =
    term
      .replace(/^https?:\/\/[^/]+\/(?:episode|anime|watch)\//i, "")
      .replace(/-[a-f0-9]{4,8}$/i, "")
      .replace(/-\d+$/, "")
      .replace(/-/g, " ")
      .trim() || term;

  return cached(`search:${cleanTerm.toLowerCase()}:${safePage}`, 5 * MIN, async () => {
    // 1. Resolve title aliases (English, Romaji, Native, synonyms)
    const [aliasData, queryTerms] = await Promise.all([
      resolveAnimeAliases(cleanTerm),
      getSearchQueryTerms(cleanTerm),
    ]);

    // 2. Query sources with the primary search term
    const { results, attempted } = await fromSources<SourcePage>("search", (s) =>
      s.search(cleanTerm, safePage),
    );
    requireResults(results, attempted, "pencarian");
    const merged = mergePages(results, safePage);

    // 3. Query Indonesian Sub sources (animein, samehadaku) with all alias & base franchise terms
    if (safePage === 1 && queryTerms.length > 1) {
      const altTerms = queryTerms
        .filter((t) => t.toLowerCase() !== cleanTerm.toLowerCase() && t.length >= 2)
        .slice(0, 4);

      for (const altTerm of altTerms) {
        try {
          const { results: altResults } = await fromSources<SourcePage>("search", (s) =>
            s.id === "animein" || s.id === "samehadaku" ? s.search(altTerm, 1) : undefined,
          );
          if (altResults.length > 0) {
            const altMerged = mergePages(altResults, 1);
            const existingKeys = new Set(merged.items.map((i) => normalizeTitle(i.title)));
            for (const item of altMerged.items) {
              const k = normalizeTitle(item.title);
              if (!existingKeys.has(k)) {
                existingKeys.add(k);
                merged.items.push(item);
              }
            }
          }
        } catch {
          // ignore alternate search error
        }
      }
    }

    // 4. On page 1, also include matching Kusonime batches (e.g. Yuru Camp Season 2 BD Batch)
    if (safePage === 1) {
      const batchQueries = [cleanTerm];
      if (aliasData?.romaji && aliasData.romaji.toLowerCase() !== cleanTerm.toLowerCase()) {
        batchQueries.push(aliasData.romaji);
      }
      for (const bQuery of batchQueries) {
        try {
          const batchHits = await withTimeout(searchBatch(bQuery), 3500, "kusonime.searchBatch");
          if (batchHits && batchHits.length > 0) {
            const existingKeys = new Set(merged.items.map((i) => normalizeTitle(i.title)));
            for (const hit of batchHits.slice(0, 5)) {
              const hitKey = normalizeTitle(hit.title);
              if (!existingKeys.has(hitKey)) {
                existingKeys.add(hitKey);
                merged.items.push({
                  id: `ks_${hit.slug}`,
                  title: hit.title,
                  poster: hit.poster,
                  cover: hit.poster,
                  score: null,
                  status: "Completed",
                  type: "Batch",
                  genres: [],
                  synopsis: null,
                  year: null,
                  views: null,
                  day: null,
                  releaseDay: null,
                  latestReleaseDate: "Batch Lengkap",
                  episodeCount: null,
                });
              }
            }
          }
        } catch {
          // ignore kusonime batch lookup error
        }
      }
    }

    // 5. Populate alternate display titles on items
    for (const item of merged.items) {
      if (!item.englishTitle && aliasData?.english) {
        item.englishTitle = aliasData.english;
      }
      if (!item.romajiTitle && aliasData?.romaji) {
        item.romajiTitle = aliasData.romaji;
      }
    }

    merged.items.sort(
      (a, b) =>
        relevance(b.title, b.id, cleanTerm, aliasData) -
        relevance(a.title, a.id, cleanTerm, aliasData),
    );
    return merged;
  });
}

/* ========================================================================== */
/*                                   GENRES                                   */
/* ========================================================================== */

const STANDARD_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Demons",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Game",
  "Harem",
  "Historical",
  "Horror",
  "Isekai",
  "Josei",
  "Kids",
  "Magic",
  "Martial Arts",
  "Mecha",
  "Military",
  "Music",
  "Mystery",
  "Parody",
  "Police",
  "Psychological",
  "Romance",
  "Samurai",
  "School",
  "Sci-Fi",
  "Seinen",
  "Shoujo",
  "Shounen",
  "Slice of Life",
  "Space",
  "Sports",
  "Super Power",
  "Supernatural",
  "Thriller",
  "Vampire",
];

export async function getGenres(_provider = "otakudesu"): Promise<GenreItem[]> {
  return cached("genres", 60 * MIN, async () => {
    const { results } = await fromSources("genres", (s) => s.getGenres?.());
    const map = new Map<string, GenreItem>();

    for (const { value } of results) {
      if (!Array.isArray(value)) continue;
      for (const genre of value) {
        const cleanName = genre.name
          .replace(/\s*\(\s*\d+\s*\)/g, "")
          .replace(/\s+anime$/i, "")
          .replace(/^-+|-+$/g, "")
          .trim();
        if (!cleanName || cleanName.length <= 1) continue;
        const id = slugify(cleanName);
        if (!id || map.has(id)) continue;
        map.set(id, { id, name: cleanName, image: genre.image });
      }
    }

    for (const standard of STANDARD_GENRES) {
      const id = slugify(standard);
      if (!map.has(id)) {
        map.set(id, { id, name: standard, image: null });
      }
    }

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function getByGenre(
  genreId: string,
  page = 1,
  _sort = "views",
  _provider = "otakudesu",
): Promise<ListResult> {
  const safePage = Math.max(1, page);
  const cleanId = genreId
    .replace(/\s*\(\s*\d+\s*\)/g, "")
    .replace(/\s*anime$/i, "")
    .replace(/-anime$/i, "")
    .trim();
  const slug = slugify(cleanId);

  return cached(`genre:${slug}:${safePage}`, 15 * MIN, async () => {
    let merged: ListResult = { items: [], page: safePage, hasNext: false };
    try {
      const { results } = await fromSources<SourcePage>("genre", (s) =>
        s.getByGenre?.(slug, safePage),
      );
      if (results.length > 0 && results.some((r) => r.value.items.length > 0)) {
        merged = mergePages(results, safePage);
      }
    } catch {
      // Fallback
    }

    if (merged.items.length === 0) {
      const searchKeyword = cleanId.replace(/-/g, " ").trim();
      const fallback = await search(searchKeyword, safePage);
      if (fallback.items.length > 0) {
        return fallback;
      }
    }

    return merged;
  });
}

/* ========================================================================== */
/*                                  SCHEDULE                                  */
/* ========================================================================== */

export async function getSchedule(_provider = "otakudesu"): Promise<ScheduleMap> {
  return cached("schedule", 30 * MIN, async () => {
    let results: SourceResult<Record<string, SourceItem[]>>[] = [];
    try {
      const outcome = await fromSources("schedule", (s) => s.getSchedule?.());
      results = outcome.results;
    } catch {
      // fallback will handle
    }

    const map: ScheduleMap = {};
    for (const day of SCHEDULE_DAYS) {
      const lists = results.map((r) => {
        const entry = Object.entries(r.value).find(([key]) => titleCaseDay(key) === day);
        return entry ? entry[1] : [];
      });
      map[day] = mergeItems(lists).map((item) => ({
        ...toSummary(item),
        releaseDay: day,
        day,
        status: item.status ?? "Ongoing",
      }));
    }

    // Check if any day has items
    const totalCount = Object.values(map).reduce((acc, list) => acc + list.length, 0);

    // If schedule sources failed or returned 0 items, construct a fallback schedule from ongoing anime
    if (totalCount === 0) {
      try {
        const [latestRes, popRes] = await Promise.all([
          getLatest(1).catch(() => ({ items: [] })),
          getPopular(1).catch(() => ({ items: [] })),
        ]);
        const ongoing = [...latestRes.items, ...popRes.items];
        const seen = new Set<string>();
        const uniqueOngoing = ongoing.filter((item) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

        if (uniqueOngoing.length > 0) {
          uniqueOngoing.forEach((item, index) => {
            const targetDay = SCHEDULE_DAYS[index % SCHEDULE_DAYS.length] ?? "Senin";
            map[targetDay] = map[targetDay] || [];
            map[targetDay].push({
              ...item,
              releaseDay: targetDay,
              day: targetDay,
              status: "Ongoing",
            });
          });
        }
      } catch {
        // keep map as is
      }
    }

    return map;
  });
}

/* ========================================================================== */
/*                                  DIRECTORY                                 */
/* ========================================================================== */

// Daftar abjad hanya ada di sumber lama, sumber baru tidak menyediakannya
export async function getDirectory(_provider = "otakudesu"): Promise<DirectoryGroup[]> {
  return [];
}

/* ========================================================================== */
/*                                ANIME DETAIL                                */
/* ========================================================================== */

// ID lama dari sumber sebelumnya tidak punya awalan, jadi dicari ulang lewat judul dari slug
async function resolveLegacyAnimeId(id: string): Promise<string | null> {
  const title = id
    .replace(/-sub-indo.*$/i, "")
    .replace(/-subtitle-indonesia.*$/i, "")
    .replace(/-/g, " ")
    .trim();
  if (!title) return null;
  const found = await search(title, 1);
  const wanted = normalizeTitle(title);
  const exact = found.items.find((item) => normalizeTitle(item.title) === wanted);
  return (exact ?? found.items[0])?.id ?? null;
}

export async function getDetail(id: string, _provider = "otakudesu"): Promise<AnimeDetail> {
  let parsed = parseId(id);
  let canonicalId = id;
  if (!parsed || parsed.kind !== "anime") {
    const replacement = await resolveLegacyAnimeId(id);
    parsed = replacement ? parseId(replacement) : null;
    if (!parsed || !replacement) throw new Error(`Anime ${id} tidak ditemukan di sumber mana pun`);
    canonicalId = replacement;
  }
  const { source: sourceId, slug } = parsed;

  return cached(`detail:${canonicalId}`, 15 * MIN, async () => {
    const detail = await withTimeout(
      getSource(sourceId).getDetail(slug),
      DETAIL_TIMEOUT_MS,
      `${sourceId}.detail`,
    );

    // Batch dicari paralel dan boleh gagal tanpa mengganggu halaman detail
    let batch: AnimeDetail["batch"] = null;
    try {
      const hit = await withTimeout(findBatchFor(detail.title), 4000, "kusonime.find");
      if (hit) batch = { title: hit.title, batchId: `ks_${hit.slug}` };
    } catch {
      batch = null;
    }

    const result: AnimeDetail = {
      id: canonicalId,
      title: detail.title,
      poster: formatSafePoster(detail.poster, detail.title),
      cover: formatSafePoster(detail.cover || detail.poster, detail.title),
      score: detail.score,
      status: detail.status,
      type: detail.type ?? "TV",
      genres: detail.genres,
      synopsis: detail.synopsis,
      year: detail.year,
      japanese: detail.japanese,
      producers: detail.producers,
      duration: detail.duration,
      aired: detail.aired,
      studio: detail.studio,
      studios: detail.studio,
      episodeCount: detail.episodes.length || null,
      batch,
      episodes: detail.episodes.map((e) => ({
        id: e.id,
        number: e.number,
        title: e.title,
        releaseDate: e.date,
      })),
      recommended: detail.recommended.map(toSummary),
    };
    return result;
  });
}

/* ========================================================================== */
/*                               STREAM AND SERVER                            */
/* ========================================================================== */

export async function extractDirectStreamUrl(embedUrl: string): Promise<string | null> {
  if (!embedUrl) return null;
  if (isDirectMediaUrl(embedUrl)) return embedUrl;
  try {
    const target = assertPublicHttpUrl(embedUrl);
    const html = await fetchText(target.toString(), {
      source: "embed",
      headers: { Referer: `${target.origin}/`, "User-Agent": BROWSER_UA },
      timeoutMs: 3500,
    });
    const matchVar = html.match(/videoURL\s*=\s*["']([^"']+)["']/i);
    if (matchVar?.[1]) return matchVar[1];
    const matchSrc = html.match(/<(?:source|video)[^>]+src=["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (matchSrc?.[1]) return matchSrc[1];
    const matchFile = html.match(/(?:file|source|src)\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i);
    if (matchFile?.[1]) return matchFile[1];
    return null;
  } catch {
    return null;
  }
}

function qualityWeight(q: string): number {
  if (q.includes("1080")) return 1080;
  if (q.includes("720")) return 720;
  if (q.includes("480")) return 480;
  if (q.includes("360")) return 360;
  if (/auto/i.test(q)) return 500;
  return 100;
}

function groupServers(stream: SourceStream): QualityServerGroup[] {
  const groups = new Map<string, QualityServerGroup>();
  for (const server of stream.servers) {
    let quality = server.quality || "Auto";
    if (quality === "1080p") quality = "1080p FHD";
    else if (quality === "720p") quality = "720p HD";
    let group = groups.get(quality);
    if (!group) {
      group = { quality, serverList: [] };
      groups.set(quality, group);
    }
    group.serverList.push({ title: server.name, serverId: encodeServerRef(server.ref) });
  }
  return [...groups.values()].sort((a, b) => qualityWeight(b.quality) - qualityWeight(a.quality));
}

async function findSubIndoAlternativeServers(
  rawTitle: string,
  episodeNumber: number,
  fallbackSlug?: string,
): Promise<SourceServer[]> {
  try {
    const cleanTitle = rawTitle
      .replace(/^watch\s+/i, "")
      .replace(/\s+(?:episode|eps)\s+\d+.*$/i, "")
      .replace(/\s+online.*$/i, "")
      .trim();
    const fallbackTitle = fallbackSlug
      ? fallbackSlug
          .replace(/^aw_(?:\d+-)?/, "")
          .replace(/-/g, " ")
          .trim()
      : "";
    const animeTitle = cleanTitle || fallbackTitle;
    if (!animeTitle) return [];

    const aliasData = await resolveAnimeAliases(animeTitle);
    const searchTerms = [
      aliasData?.romaji?.replace(/[△▲★☆]/g, " ").trim(),
      aliasData?.romaji
        ?.replace(/\b(?:season|musim|s)\s*\d+\b/gi, "")
        .replace(/[△▲★☆]/g, " ")
        .trim(),
      animeTitle
        .replace(/\b(?:season|musim|s)\s*\d+\b/gi, "")
        .replace(/[△▲★☆]/g, " ")
        .trim(),
      animeTitle,
    ].filter(Boolean) as string[];

    for (const term of searchTerms) {
      if (term.length < 3) continue;
      const res = await withTimeout(animein.search(term, 1), 3500, "animein.subIndoCheck");
      if (res && res.items.length > 0) {
        // Find best matching anime
        const candidate =
          res.items.find((item) => {
            const t = item.title.toLowerCase();
            const seasonMatch = animeTitle.match(/\b(?:season\s*|s)(\d+)\b/i);
            if (seasonMatch) {
              return t.includes(`season ${seasonMatch[1]}`) || t.includes(`s${seasonMatch[1]}`);
            }
            return !t.includes("season 2") && !t.includes("season 3") && !t.includes("movie");
          }) || res.items[0];

        if (candidate) {
          const cleanSlug = candidate.id.replace(/^ai_/, "");
          const detail = await withTimeout(
            animein.getDetail(cleanSlug),
            3500,
            "animein.subIndoDetail",
          );
          const targetEp = detail.episodes.find((e) => e.number === episodeNumber);
          if (targetEp) {
            const epSlug = targetEp.id.replace(/^ai_ep_/, "");
            const epStream = await withTimeout(
              animein.getStream(epSlug),
              3500,
              "animein.subIndoStream",
            );
            if (epStream && epStream.servers.length > 0) {
              return epStream.servers.map((s) => ({
                name: `${s.name}`,
                quality:
                  s.quality === "1080p"
                    ? "1080p FHD"
                    : s.quality === "720p"
                      ? "720p HD"
                      : s.quality,
                ref: s.ref,
              }));
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export async function getStream(episodeId: string, _provider = "otakudesu"): Promise<StreamResult> {
  const parsed = parseId(episodeId);
  if (!parsed || parsed.kind !== "episode") {
    throw new Error("ID episode lama tidak dikenali, buka lagi lewat halaman anime");
  }

  const stream = await cached(`stream:${episodeId}`, 3 * MIN, () =>
    withTimeout(
      getSource(parsed.source).getStream(parsed.slug),
      DETAIL_TIMEOUT_MS,
      `${parsed.source}.stream`,
    ),
  );

  // If the stream is from Aniwatch (English subs), search for Sub Indo servers from AnimeIn
  if (parsed.source === "aniwatch") {
    try {
      const epNumMatch = parsed.slug.match(/-(\d+)-/) ?? parsed.slug.match(/-(\d+)$/);
      const epNumber = epNumMatch ? parseInt(epNumMatch[1], 10) : 1;
      const subIndoServers = await findSubIndoAlternativeServers(
        stream.title,
        epNumber,
        stream.animeId,
      );
      if (subIndoServers.length > 0) {
        stream.servers.unshift(...subIndoServers);
      }
    } catch {
      // ignore cross-source sub indo lookup error
    }
  }

  // Sort servers so highest resolution (1080p FHD > 720p HD > 480p > Auto > 360p) is preferred
  const sortedServers = [...stream.servers].sort(
    (a, b) => qualityWeight(b.quality || "Auto") - qualityWeight(a.quality || "Auto"),
  );
  const preferredServer = sortedServers[0] || stream.servers[0];
  const embedUrl =
    preferredServer && preferredServer.ref.kind === "url" ? preferredServer.ref.url : null;
  const directUrl = embedUrl ? await extractDirectStreamUrl(embedUrl) : null;

  return {
    title: stream.title,
    animeId: stream.animeId,
    episodeId,
    releaseTime: stream.releaseTime,
    defaultStreamingUrl: directUrl || embedUrl,
    directUrl,
    embedUrl,
    hasPrevEpisode: Boolean(stream.prevEpisodeId),
    prevEpisodeId: stream.prevEpisodeId,
    hasNextEpisode: Boolean(stream.nextEpisodeId),
    nextEpisodeId: stream.nextEpisodeId,
    servers: { qualities: groupServers(stream) },
    downloads: stream.downloads,
  };
}

export async function resolveServer(
  serverId: string,
  _provider = "otakudesu",
): Promise<{ url: string }> {
  try {
    const ref = decodeServerRef(serverId);
    if (!ref) return { url: "" };

    let rawUrl = "";
    if (ref.kind === "url") {
      if (ref.url.startsWith("/api/")) {
        return { url: ref.url };
      }
      rawUrl = assertPublicHttpUrl(ref.url).toString();
    } else if (ref.kind === "samehadaku") {
      rawUrl = await resolveSamehadakuPlayer(ref);
    } else {
      rawUrl = await resolveNontonAnimeIdPlayer(ref);
    }
    if (!rawUrl) return { url: "" };

    const direct = await extractDirectStreamUrl(rawUrl);
    return { url: direct || rawUrl };
  } catch (error) {
    console.error("Error resolving server:", error);
    return { url: "" };
  }
}

/* ========================================================================== */
/*                                   BATCH                                    */
/* ========================================================================== */

export async function getBatch(
  batchId: string,
  _provider = "otakudesu",
): Promise<BatchDetail | null> {
  if (!batchId.startsWith("ks_")) return null;
  try {
    return await cached(`batch:${batchId}`, 30 * MIN, async () => {
      const detail = await getBatchDetail(batchId.slice(3));
      if (!detail) throw new Error("Batch tidak ditemukan");
      return detail;
    });
  } catch (error) {
    console.error(`Error in getBatch for ${batchId}:`, error);
    return null;
  }
}
