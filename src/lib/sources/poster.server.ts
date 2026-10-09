const anilistCache = new Map<string, string>();

/**
 * Strips WordPress and CDN downscaled thumbnail dimensions and resize parameters
 * to retrieve the original high-definition (HD) master image.
 * Examples:
 *   - anime-150x225.jpg -> anime.jpg
 *   - poster-300x450.webp -> poster.webp
 *   - image.jpg?resize=150,225 -> image.jpg
 */
export function cleanToHdPosterUrl(url: string | null | undefined): string {
  if (!url) return "";
  let clean = url.trim();

  // Strip WordPress thumbnail dimension suffixes: -300x450, -150x225, -215x320, -175x250, etc.
  clean = clean.replace(/-\d+x\d+(\.(?:jpg|jpeg|png|webp|avif))/i, "$1");

  // Strip CDN downscaling query parameters like resize, fit, w, h
  if (clean.includes("?")) {
    try {
      const u = new URL(clean);
      u.searchParams.delete("resize");
      u.searchParams.delete("w");
      u.searchParams.delete("h");
      u.searchParams.delete("fit");
      u.searchParams.delete("quality");
      clean = u.toString();
    } catch {
      clean = clean.replace(/[?&](?:resize|w|h|fit|quality)=[^&]+/gi, "");
      clean = clean.replace(/\?$/, "");
    }
  }

  return clean;
}

export function generateFallbackSvg(title?: string): string {
  const safeTitle = (title || "Anime").replace(/[<>&"']/g, "");
  const displayTitle = safeTitle.length > 24 ? safeTitle.slice(0, 23) + "…" : safeTitle;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#141824"/>
        <stop offset="50%" stop-color="#0e1017"/>
        <stop offset="100%" stop-color="#1a1d2c"/>
      </linearGradient>
      <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#e11d48" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.4"/>
      </linearGradient>
    </defs>
    <rect width="300" height="450" fill="url(#bg)"/>
    <circle cx="150" cy="180" r="48" fill="#e11d48" fill-opacity="0.12"/>
    <polygon points="144,165 144,195 166,180" fill="#e11d48"/>
    <rect x="20" y="420" width="260" height="4" rx="2" fill="url(#glow)"/>
    <text x="150" y="270" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" opacity="0.95">
      ${displayTitle}
    </text>
    <text x="150" y="295" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500">
      Nontonime
    </text>
  </svg>`;
}

export async function fetchAniListCover(title: string): Promise<string | null> {
  const cleanTitle = title
    .replace(/^nonton\s+(anime\s+)?/i, "")
    .replace(/\s+episode\s+\d+.*$/i, "")
    .replace(/\s+sub\s+indo.*$/i, "")
    .replace(/\s+subtitle\s+indonesia.*$/i, "")
    .replace(/\s*\(?(tv|movie|ova|ona)\)?$/i, "")
    .trim();
  if (!cleanTitle) return null;

  const cacheKey = cleanTitle.toLowerCase();
  if (anilistCache.has(cacheKey)) {
    return anilistCache.get(cacheKey) || null;
  }

  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        coverImage { extraLarge large medium }
        bannerImage
      }
    }
  `;

  const candidates = [cleanTitle];
  if (cleanTitle.includes(":")) candidates.push(cleanTitle.split(":")[0]!.trim());
  if (cleanTitle.includes("–")) candidates.push(cleanTitle.split("–")[0]!.trim());
  if (cleanTitle.includes("-")) candidates.push(cleanTitle.split("-")[0]!.trim());

  for (const candidate of candidates) {
    if (!candidate || candidate.length < 3) continue;
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables: { search: candidate } }),
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          data?: {
            Media?: {
              coverImage?: { extraLarge?: string; large?: string; medium?: string };
              bannerImage?: string;
            };
          };
        };
        const url =
          json.data?.Media?.coverImage?.extraLarge ||
          json.data?.Media?.coverImage?.large ||
          json.data?.Media?.coverImage?.medium;
        if (url) {
          anilistCache.set(cacheKey, url);
          return url;
        }
      }
    } catch {
      // Timeout or network error
    }
  }

  anilistCache.set(cacheKey, "");
  return null;
}

export function formatSafePoster(rawPoster: string | null | undefined, title: string): string {
  const cleaned = cleanToHdPosterUrl(rawPoster);
  if (cleaned.startsWith("/api/image-proxy")) return cleaned;
  if (
    cleaned &&
    !cleaned.includes("xyz-api.animein.net") &&
    !cleaned.endsWith("/images/poster/.webp") &&
    !cleaned.includes("default-poster") &&
    !cleaned.includes("no-poster.svg")
  ) {
    return cleaned;
  }
  return `/api/image-proxy?title=${encodeURIComponent(title)}&url=${encodeURIComponent(cleaned)}`;
}
