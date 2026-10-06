import { fetchAniListCover, generateFallbackSvg } from "./sources/poster.server";

export async function handleImageProxyRequest(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get("url") || "";
  const title = reqUrl.searchParams.get("title") || "";

  // 1. If anime title is provided, AniList cover is the fastest, highest-quality CDN image
  if (title) {
    try {
      const anilistCover = await fetchAniListCover(title);
      if (anilistCover) {
        return Response.redirect(anilistCover, 302);
      }
    } catch {
      // Continue to URL proxy or fallback
    }
  }

  // 2. If valid target image URL exists and is not blocked by Cloudflare (xyz-api)
  if (
    targetUrl &&
    !targetUrl.includes("xyz-api.animein.net") &&
    !targetUrl.endsWith("/images/poster/.webp")
  ) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const headers: Record<string, string> = {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: `${parsed.origin}/`,
        };

        const res = await fetch(targetUrl, {
          headers,
          signal: AbortSignal.timeout(4000),
        });

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.startsWith("image/")) {
          const body = await res.arrayBuffer();
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control":
                "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. Guaranteed graceful fallback: visually appealing SVG poster
  const svg = generateFallbackSvg(title);
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
