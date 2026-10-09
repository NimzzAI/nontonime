/**
 * Pembersih kueri pencarian. Murni fungsi (tanpa jaringan) supaya mudah dites.
 *
 * Masalah lama: kata seperti "sub indo" dan "season 2" ikut dikirim apa adanya ke mesin
 * pencari situs sumber. Situs WordPress mencari SEMUA kata, jadi
 * "yuru camp sub indo season 2" tidak menemukan "Yuru Camp△ Season 2".
 * Sekarang kata pengganggu dibuang, nomor season dipisah, lalu season dipakai untuk
 * mengurutkan hasil, bukan untuk menyaring ke situs.
 */

export interface ParsedQuery {
  raw: string;
  /** Judul inti tanpa kata pengganggu dan tanpa penanda season. */
  base: string;
  /** Nomor season yang diminta (2 ke atas), atau null. */
  season: number | null;
}

const ROMAN: Record<string, number> = { ii: 2, iii: 3, iv: 4, v: 5, vi: 6 };
const SYMBOLS = /[△▲▽★☆♪♥♡]/g;

function squash(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripSymbols(value: string): string {
  return squash(value.replace(SYMBOLS, " "));
}

export function parseSearchQuery(raw: string): ParsedQuery {
  let s = ` ${raw} `
    .replace(/\bsub(?:title)?\s*(?:indo(?:nesia)?|id)\b/gi, " ")
    .replace(/\b(?:episode|eps?)\s*\d+\b/gi, " ")
    .replace(/\b(?:nonton|streaming|download|unduh|batch|lengkap|bluray|bd)\b/gi, " ")
    .replace(/^\s*anime\s+/i, " ");
  s = squash(s.replace(SYMBOLS, " "));

  let season: number | null = null;
  const take = (re: RegExp, read: (m: RegExpMatchArray) => number | null): boolean => {
    const m = s.match(re);
    if (!m) return false;
    const n = read(m);
    if (n === null || n < 1 || n > 20) return false;
    season = n;
    s = squash(s.replace(m[0], " "));
    return true;
  };
  const num = (m: RegExpMatchArray) => Number(m[1]);

  void (
    take(/\b(\d{1,2})(?:st|nd|rd|th)\s*season\b/i, num) ||
    take(/\b(?:season|musim|sezon)\s*(\d{1,2})\b/i, num) ||
    take(/\bseason\s*(ii|iii|iv|v|vi)\b/i, (m) => ROMAN[(m[1] ?? "").toLowerCase()] ?? null) ||
    take(/\bs(\d{1,2})\b/i, num) ||
    (s.split(" ").length >= 2 &&
      take(/\s(\d{1,2})$/, (m) => (Number(m[1]) >= 2 && Number(m[1]) <= 12 ? Number(m[1]) : null)))
  );

  return { raw, base: s || squash(raw), season };
}

/** Season yang tertulis di judul hasil. null bila judul tidak menandai season apa pun. */
export function titleSeason(title: string): number | null {
  const t = stripSymbols(title.toLowerCase());
  const patterns: [RegExp, (m: RegExpMatchArray) => number | null][] = [
    [/\b(\d{1,2})(?:st|nd|rd|th)\s*season\b/, (m) => Number(m[1])],
    [/\bseason\s*(\d{1,2})\b/, (m) => Number(m[1])],
    [/\bseason\s*(ii|iii|iv|v|vi)\b/, (m) => ROMAN[m[1] ?? ""] ?? null],
    [/\bs(\d{1,2})\b/, (m) => Number(m[1])],
    [/\s(ii|iii|iv)$/, (m) => ROMAN[m[1] ?? ""] ?? null],
    [/\s(\d{1,2})$/, (m) => (Number(m[1]) >= 2 && Number(m[1]) <= 12 ? Number(m[1]) : null)],
  ];
  for (const [re, read] of patterns) {
    const m = t.match(re);
    if (m) {
      const n = read(m);
      if (n !== null && n >= 1 && n <= 20) return n;
    }
  }
  return null;
}

/** Huruf kecil, tanpa simbol dan tanda baca, spasi dirapikan. */
export function normalizeLoose(value: string): string {
  return squash(
    value
      .toLowerCase()
      .replace(SYMBOLS, " ")
      .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/g, " "),
  );
}

/** Menghapus penanda season supaya "yuru camp season 2" dan "yuru camp" bisa dibandingkan. */
export function stripSeasonWords(value: string): string {
  return squash(
    value
      .replace(/\b\d{1,2}(?:st|nd|rd|th)\s*season\b/g, " ")
      .replace(/\b(?:season|musim)\s*(?:\d{1,2}|ii|iii|iv|v|vi)\b/g, " ")
      .replace(/\bs\d{1,2}\b/g, " ")
      .replace(/\s(?:ii|iii|iv)$/, " ")
      .replace(/\s\d{1,2}$/, " "),
  );
}

export function levenshtein(a: string, b: string, max = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      const v = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length] ?? max + 1;
}

/** Seberapa banyak kata kueri muncul di judul (0 sampai 1), toleran terhadap "yurucamp" vs "yuru camp". */
export function tokenCoverage(query: string, title: string): number {
  const q = normalizeLoose(query);
  const t = normalizeLoose(title);
  if (!q || !t) return 0;
  if (t.replace(/ /g, "").includes(q.replace(/ /g, ""))) return 1;
  const tokens = q.split(" ").filter(Boolean);
  const titleTokens = t.split(" ");
  const hits = tokens.filter((w) =>
    titleTokens.some((tw) => tw === w || (w.length >= 4 && tw.startsWith(w))),
  ).length;
  return tokens.length ? hits / tokens.length : 0;
}

/** Cek apakah hasil alias dari luar benar-benar mirip dengan yang diketik pengguna. */
export function looksRelated(query: string, candidates: (string | null | undefined)[]): boolean {
  const q = normalizeLoose(query);
  if (!q) return false;
  return candidates.some((c) => {
    if (!c) return false;
    const n = normalizeLoose(c);
    if (!n) return false;
    if (n.includes(q) || q.includes(n)) return true;
    if (tokenCoverage(q, n) >= 0.6) return true;
    return (
      levenshtein(q, n, Math.max(2, Math.floor(q.length * 0.3))) <=
      Math.max(2, Math.floor(q.length * 0.3))
    );
  });
}
