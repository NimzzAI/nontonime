/**
 * Dedicated CORS-Bypass Proxy Service & Stream Inspector for Nimegami & BerkasDrive.
 *
 * Fulfills security checks by setting upstream Referer, Origin, and User-Agent headers,
 * supports RFC 7233 HTTP Range requests (seeking/buffering), and eliminates CORS
 * restrictions so Nimegami streams play smoothly in HTML5 / Video.js.
 */

const NIMEGAMI_DOMAINS = [
  "nimegami.id",
  "berkasdrive.com",
  "vsys-srv.berkasdrive.com",
  "direct-stor.berkasdrive.com",
  "usersdrive.com",
];

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Quick in-memory cache for resolved direct MP4 URLs from vsys-srv embed pages (TTL: 1 hour)
const resolvedMediaCache = new Map<string, { url: string; expiresAt: number }>();

export function isNimegamiOrBerkasDriveUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return NIMEGAMI_DOMAINS.some((domain) => lower.includes(domain));
}

export function buildNimegamiProxyUrl(
  targetUrl: string,
  options?: { format?: "embed" | "stream" },
): string {
  if (!targetUrl) return "";
  if (targetUrl.startsWith("/api/nimegami-proxy")) return targetUrl;
  const param = encodeURIComponent(targetUrl);
  const fmt = options?.format ? `&format=${options.format}` : "";
  return `/api/nimegami-proxy?url=${param}${fmt}`;
}

/**
 * Resolves a Nimegami / vsys-srv.berkasdrive.com embed URL to its actual direct video storage URL.
 */
export async function resolveNimegamiDirectMediaUrl(embedUrl: string): Promise<string> {
  if (!embedUrl) return "";

  // If already a direct media URL
  if (
    embedUrl.includes("direct-stor.berkasdrive.com") ||
    embedUrl.includes("videoplayback") ||
    embedUrl.includes("googlevideo.com") ||
    /\.(mp4|m3u8|webm)(\?|$)/i.test(embedUrl)
  ) {
    return embedUrl;
  }

  // Check memory cache
  const cached = resolvedMediaCache.get(embedUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const upstream = await fetch(embedUrl, {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_UA,
        Referer: "https://nimegami.id/",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(7000),
    });

    const html = await upstream.text();

    // Look for video element src, data-src, or script videoURL
    const match =
      html.match(/<(?:source|video)[^>]+src=["']([^"']+)["']/i) ||
      html.match(/data-(?:src|video|url)=["']([^"']+)["']/i) ||
      html.match(/videoURL\s*=\s*["']([^"']+)["']/i) ||
      html.match(
        /src=["'](https?:\/\/[^"']*(?:videoplayback|googlevideo|\.mp4|\.m3u8)[^"']*)["']/i,
      ) ||
      html.match(/(https?:\/\/[^"'\s<>]+\.(?:mp4|m3u8)[^"'\s<>]*)/i) ||
      html.match(/(https?:\/\/[^"'\s<>]*videoplayback[^"'\s<>]*)/i);

    if (match?.[1]) {
      const directUrl = match[1].replace(/&amp;/g, "&");
      resolvedMediaCache.set(embedUrl, {
        url: directUrl,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      return directUrl;
    }
  } catch (err) {
    console.warn("Failed to extract direct media URL from Nimegami page:", err);
  }

  return embedUrl;
}

/**
 * Returns standard permissive CORS headers for Nimegami streaming.
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers":
      "Range, Content-Type, Accept, Origin, User-Agent, X-Requested-With",
    "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges, Content-Type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

/**
 * Generates a clean, modern responsive HTML5 video bypass player for iframe embed scenarios.
 */
function renderNimegamiBypassPlayerHtml(proxiedStreamUrl: string, title?: string): string {
  const safeTitle = (title || "Nimegami Player").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${safeTitle} - Nontonime Bypass</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .player-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; outline: none; }
    .badge { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; border: 1px solid rgba(255,255,255,0.15); pointer-events: none; z-index: 10; display: flex; align-items: center; gap: 6px; }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
  </style>
</head>
<body>
  <div class="player-container">
    <div class="badge">
      <span class="badge-dot"></span>
      <span>Nimegami Direct Stream Bypass</span>
    </div>
    <video
      id="videoPlayer"
      controls
      playsinline
      webkit-playsinline
      autoplay
      preload="auto"
      crossorigin="anonymous"
      src="${proxiedStreamUrl}"
    >
      <source src="${proxiedStreamUrl}" type="video/mp4" />
      Browser Anda tidak mendukung pemutar video HTML5.
    </video>
  </div>
  <script>
    const v = document.getElementById("videoPlayer");
    v.addEventListener("play", () => {
      try { window.parent.postMessage({ type: "play" }, "*"); } catch(e) {}
    });
    v.addEventListener("ended", () => {
      try { window.parent.postMessage({ type: "ended" }, "*"); } catch(e) {}
    });
  </script>
</body>
</html>`;
}

/**
 * Main HTTP handler for /api/nimegami-proxy
 */
export async function handleNimegamiStreamProxy(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(request),
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const targetParam = reqUrl.searchParams.get("url");
  if (!targetParam) {
    return new Response(
      JSON.stringify({ error: "MISSING_URL", message: "Parameter 'url' wajib disertakan" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(request) },
      },
    );
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetParam);
  } catch {
    return new Response(
      JSON.stringify({ error: "INVALID_URL", message: "URL yang diminta tidak valid" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(request) },
      },
    );
  }

  const format = reqUrl.searchParams.get("format");
  const acceptHeader = request.headers.get("accept") || "";

  // If requested as embed player or if browser requests text/html directly
  if (
    format === "embed" ||
    (acceptHeader.includes("text/html") && !reqUrl.searchParams.has("raw"))
  ) {
    // Resolve direct media URL first
    const directUrl = await resolveNimegamiDirectMediaUrl(parsedTarget.toString());
    const streamProxyUrl = `/api/nimegami-proxy?url=${encodeURIComponent(directUrl)}&raw=1`;
    const html = renderNimegamiBypassPlayerHtml(
      streamProxyUrl,
      parsedTarget.searchParams.get("name") || "Nimegami Stream",
    );

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...getCorsHeaders(request),
        "Content-Security-Policy": "frame-ancestors *",
        "Cache-Control": "public, max-age=1800",
      },
    });
  }

  // Resolve to direct media URL if target is an embed page
  let effectiveTarget = parsedTarget.toString();
  if (
    effectiveTarget.includes("vsys-srv.berkasdrive.com/hal/streaming") ||
    effectiveTarget.includes("/hal/streaming/") ||
    effectiveTarget.includes("workers-anime.berkasdrive.com") ||
    effectiveTarget.includes("desustream.net") ||
    effectiveTarget.includes("desudrive.com")
  ) {
    effectiveTarget = await resolveNimegamiDirectMediaUrl(effectiveTarget);
  }

  const effectiveParsed = new URL(effectiveTarget);

  // Build security headers required to satisfy target server security checks
  const clientRange = request.headers.get("range");
  const upstreamHeaders: Record<string, string> = {
    "User-Agent": BROWSER_UA,
    Accept: "*/*",
    "Accept-Encoding": "identity", // Essential so upstream won't gzip media and break byte offsets
  };

  if (clientRange) {
    upstreamHeaders["Range"] = clientRange;
  }

  // Security checks: set exact Referer and Origin for Berkasdrive & Nimegami
  if (
    effectiveParsed.hostname.includes("googlevideo.com") ||
    effectiveParsed.hostname.includes("workers-anime")
  ) {
    upstreamHeaders["Referer"] = "https://workers-anime.berkasdrive.com/";
    upstreamHeaders["Origin"] = "https://workers-anime.berkasdrive.com";
  } else if (
    effectiveParsed.hostname.includes("berkasdrive.com") ||
    effectiveParsed.hostname.includes("direct-stor") ||
    effectiveParsed.hostname.includes("vsys-srv")
  ) {
    upstreamHeaders["Referer"] = "https://vsys-srv.berkasdrive.com/";
    upstreamHeaders["Origin"] = "https://vsys-srv.berkasdrive.com";
  } else if (effectiveParsed.hostname.includes("nimegami")) {
    upstreamHeaders["Referer"] = "https://nimegami.id/";
    upstreamHeaders["Origin"] = "https://nimegami.id";
  } else {
    upstreamHeaders["Referer"] = `${effectiveParsed.protocol}//${effectiveParsed.host}/`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for large media connections

    const upstreamRes = await fetch(effectiveTarget, {
      method: "GET",
      headers: upstreamHeaders,
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If upstream unexpectedly returned HTML embed page when raw stream was expected, try one more time to parse direct video
    const contentType = upstreamRes.headers.get("content-type") || "";
    if (contentType.includes("text/html") && !effectiveTarget.includes("direct-stor")) {
      const htmlText = await upstreamRes.text();
      const match =
        htmlText.match(/<(?:source|video)[^>]+src=["']([^"']+)["']/i) ||
        htmlText.match(/data-(?:src|video|url)=["']([^"']+)["']/i) ||
        htmlText.match(/videoURL\s*=\s*["']([^"']+)["']/i) ||
        htmlText.match(
          /src=["'](https?:\/\/[^"']*(?:videoplayback|googlevideo|\.mp4|\.m3u8)[^"']*)["']/i,
        ) ||
        htmlText.match(/(https?:\/\/[^"'\s<>]+\.(?:mp4|m3u8)[^"'\s<>]*)/i) ||
        htmlText.match(/(https?:\/\/[^"'\s<>]*videoplayback[^"'\s<>]*)/i);

      if (match?.[1]) {
        const nextUrl = match[1].replace(/&amp;/g, "&");
        const redirectedReq = new Request(
          `${reqUrl.origin}/api/nimegami-proxy?url=${encodeURIComponent(nextUrl)}&raw=1`,
          {
            method: request.method,
            headers: request.headers,
          },
        );
        return handleNimegamiStreamProxy(redirectedReq);
      }

      // If no direct video found, return clean bypass player html
      const bypassHtml = renderNimegamiBypassPlayerHtml(effectiveTarget, "Nimegami Player");
      return new Response(bypassHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          ...getCorsHeaders(request),
          "Content-Security-Policy": "frame-ancestors *",
        },
      });
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new Response(
        JSON.stringify({
          error: "UPSTREAM_ERROR",
          status: upstreamRes.status,
          message: `Server penyedia streaming menolak koneksi (HTTP ${upstreamRes.status} ${upstreamRes.statusText})`,
        }),
        {
          status: upstreamRes.status >= 400 && upstreamRes.status < 500 ? upstreamRes.status : 502,
          headers: { "Content-Type": "application/json", ...getCorsHeaders(request) },
        },
      );
    }

    // Build client stream response headers
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");

    for (const [k, v] of Object.entries(getCorsHeaders(request))) {
      responseHeaders.set(k, v);
    }

    responseHeaders.set("Cache-Control", "public, max-age=14400");

    if (upstreamRes.headers.has("content-range")) {
      responseHeaders.set("Content-Range", upstreamRes.headers.get("content-range")!);
    }
    if (upstreamRes.headers.has("content-length")) {
      responseHeaders.set("Content-Length", upstreamRes.headers.get("content-length")!);
    }
    if (upstreamRes.headers.has("etag")) {
      responseHeaders.set("ETag", upstreamRes.headers.get("etag")!);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Nimegami stream proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "PROXY_FETCH_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Gagal terhubung ke server media Nimegami / BerkasDrive",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(request) },
      },
    );
  }
}
