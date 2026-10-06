export function getSafePosterUrl(poster?: string | null, title?: string): string {
  const p = (poster || "").trim();
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
