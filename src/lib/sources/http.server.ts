export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 9000;

export class SourceError extends Error {
  readonly source: string;
  readonly status: number | null;

  constructor(source: string, message: string, status: number | null = null) {
    super(`[${source}] ${message}`);
    this.name = "SourceError";
    this.source = source;
    this.status = status;
  }
}

export interface RequestOptions {
  source: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  method?: "GET" | "POST";
  body?: string;
}

export function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 60);
  }
}

export async function request(url: string, opts: RequestOptions): Promise<Response> {
  const { source, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, method = "GET", body } = opts;
  const init: RequestInit = {
    method,
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      ...headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  };
  if (body !== undefined) init.body = body;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new SourceError(source, `Gagal terhubung ke ${safeHost(url)}: ${reason}`);
  }
  if (!res.ok) {
    throw new SourceError(source, `HTTP ${res.status} dari ${safeHost(url)}`, res.status);
  }
  return res;
}

export async function fetchText(url: string, opts: RequestOptions): Promise<string> {
  const res = await request(url, opts);
  return res.text();
}

export async function fetchJson<T>(url: string, opts: RequestOptions): Promise<T> {
  const res = await request(url, {
    ...opts,
    headers: { Accept: "application/json, text/plain, */*", ...(opts.headers ?? {}) },
  });
  return (await res.json()) as T;
}

export function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function lastSegment(href: string | null | undefined): string {
  const path = (href ?? "").split(/[?#]/)[0] ?? "";
  return path.replace(/\/+$/, "").split("/").pop() ?? "";
}

export function absUrl(base: string, href: string | null | undefined): string {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("//")) return `https:${href}`;
  return `${base.replace(/\/+$/, "")}${href.startsWith("/") ? "" : "/"}${href}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isFinite(num) ? num : null;
}

export function isDirectMediaUrl(url: string): boolean {
  return /\.(m3u8|mp4|webm|mkv)(\?|$)/i.test(url);
}

export function episodeNumberFrom(text: string | null | undefined, fallback: number): number {
  const source = text ?? "";
  const labeled = source.match(/(?:episode|eps|ep)[\s._-]*(\d+(?:\.\d+)?)/i);
  if (labeled?.[1]) return parseFloat(labeled[1]);
  const anyNumber = source.match(/(\d+(?:\.\d+)?)/);
  if (anyNumber?.[1]) return parseFloat(anyNumber[1]);
  return fallback;
}
