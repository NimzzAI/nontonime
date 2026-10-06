/**
 * Strips downscaled dimensions (-150x225, -300x450, ?resize=...)
 * to request and display full HD quality posters.
 */
export function cleanToHdPosterUrl(url?: string | null): string {
  if (!url) return "";
  let clean = url.trim();
  clean = clean.replace(/-\d+x\d+(\.(?:jpg|jpeg|png|webp|avif))/i, "$1");
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

export function getSafePosterUrl(poster?: string | null, title?: string): string {
  const p = cleanToHdPosterUrl(poster);
  if (p.startsWith("/api/image-proxy")) return p;
  if (
    p &&
    !p.toLowerCase().includes("logo") &&
    !p.includes("xyz-api.animein.net") &&
    !p.endsWith("/images/poster/.webp") &&
    !p.includes("default-poster") &&
    !p.includes("no-poster") &&
    !p.startsWith("data:image/svg")
  ) {
    return p;
  }
  return `/api/image-proxy?title=${encodeURIComponent(title || "Anime")}&url=${encodeURIComponent(p)}`;
}
