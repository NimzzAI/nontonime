/**
 * High-performance, zero-buffering Streaming Proxy & Stream Inspector.
 *
 * Features:
 * - RFC 7233 HTTP Range Request forwarding (seek, pause, resume for large files)
 * - Zero in-memory buffering (streams chunk-by-chunk via ReadableStream)
 * - SSRF protection (blocks localhost and private cloud IP ranges)
 * - Transparent CORS headers so HTML5 / Video.js can play without cross-origin blocks
 * - Provider-compliant stream inspection (detects MP4 vs HLS vs Embed vs MEGA)
 */

function isInternalOrPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }
  // Check IPv4 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
  const ipv4Match = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const b0 = parseInt(ipv4Match[1], 10);
    const b1 = parseInt(ipv4Match[2], 10);
    if (b0 === 10) return true;
    if (b0 === 127) return true;
    if (b0 === 169 && b1 === 254) return true;
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    if (b0 === 192 && b1 === 168) return true;
    if (b0 === 0) return true;
  }
  return false;
}

export function isDirectMediaExtension(url: string): boolean {
  return /\.(mp4|m3u8|webm|mkv|mov)(\?|$)/i.test(url);
}

export function isMegaUrl(url: string): boolean {
  return /mega\.(nz|io)\/(embed|file)\//i.test(url);
}

/**
 * Handles GET /api/stream-proxy?url=...
 */
export async function handleStreamProxyRequest(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type, Accept, Origin, User-Agent",
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  if (parsedTarget.protocol !== "http:" && parsedTarget.protocol !== "https:") {
    return new Response(
      JSON.stringify({
        error: "UNSUPPORTED_PROTOCOL",
        message: "Hanya protokol HTTP/HTTPS yang didukung",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  if (isInternalOrPrivateHost(parsedTarget.hostname)) {
    return new Response(
      JSON.stringify({ error: "RESTRICTED_HOST", message: "Akses ke host internal ditolak" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  // MEGA URLs are encrypted web pages, cannot be streamed as raw bytes
  if (isMegaUrl(parsedTarget.toString())) {
    return new Response(
      JSON.stringify({
        error: "MEGA_NOT_STREAMABLE",
        message:
          "File MEGA.nz terenkripsi secara client-side dan tidak dapat diproxy sebagai media raw. Gunakan mode embed.",
        isMega: true,
      }),
      {
        status: 415,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  // Build upstream request headers
  const clientRange = request.headers.get("range");
  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Encoding": "identity", // Essential so upstream won't gzip media and break byte offsets
  };

  if (clientRange) {
    upstreamHeaders["Range"] = clientRange;
  }

  // Set appropriate Referer header
  if (parsedTarget.hostname.includes("odcloud") || parsedTarget.hostname.includes("desustream")) {
    upstreamHeaders["Referer"] = "https://otakudesu.cloud/";
  } else {
    upstreamHeaders["Referer"] = `${parsedTarget.protocol}//${parsedTarget.host}/`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second initial connection timeout

    const upstreamRes = await fetch(parsedTarget.toString(), {
      method: "GET",
      headers: upstreamHeaders,
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If upstream returns an error status (e.g. 403 Forbidden or 404 Not Found)
    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new Response(
        JSON.stringify({
          error: "UPSTREAM_ERROR",
          status: upstreamRes.status,
          message: `Server sumber menolak permintaan (HTTP ${upstreamRes.status} ${upstreamRes.statusText})`,
        }),
        {
          status: upstreamRes.status >= 400 && upstreamRes.status < 500 ? upstreamRes.status : 502,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "";

    // If upstream unexpectedly returned HTML, it's likely an error/embed page, not video
    if (contentType.includes("text/html") && !isDirectMediaExtension(parsedTarget.pathname)) {
      return new Response(
        JSON.stringify({
          error: "NOT_A_MEDIA_STREAM",
          contentType,
          message: "Sumber ini merupakan halaman web embed (HTML) dan bukan stream video langsung.",
        }),
        {
          status: 415,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    // Prepare response headers for client streaming
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Origin");
    responseHeaders.set(
      "Access-Control-Expose-Headers",
      "Content-Range, Content-Length, Accept-Ranges, Content-Type",
    );
    responseHeaders.set("Cache-Control", "public, max-age=3600");

    if (upstreamRes.headers.has("content-range")) {
      responseHeaders.set("Content-Range", upstreamRes.headers.get("content-range")!);
    }
    if (upstreamRes.headers.has("content-length")) {
      responseHeaders.set("Content-Length", upstreamRes.headers.get("content-length")!);
    }

    // Directly pipe upstream ReadableStream to client Response (zero in-memory buffering!)
    return new Response(upstreamRes.body, {
      status: upstreamRes.status, // 206 Partial Content or 200 OK
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Stream proxy error for", parsedTarget.toString(), errorMsg);
    return new Response(
      JSON.stringify({
        error: "PROXY_CONNECTION_FAILED",
        message: "Gagal terhubung ke server streaming sumber: " + errorMsg,
      }),
      {
        status: 504,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }
}

/**
 * Handles GET /api/stream-check?url=...
 * Quickly probes an upstream URL with a lightweight HEAD/Range test to determine type and health.
 */
export async function handleStreamCheckRequest(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const targetParam = reqUrl.searchParams.get("url");

  if (!targetParam) {
    return new Response(JSON.stringify({ ok: false, error: "MISSING_URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetParam);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (isMegaUrl(parsed.toString())) {
    return new Response(
      JSON.stringify({
        ok: true,
        isMega: true,
        isDirectMedia: false,
        isIframeEmbed: true,
        contentType: "text/html",
        message: "MEGA Cloud Encrypted Embed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const startTime = Date.now();
    const res = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Range: "bytes=0-1",
        Accept: "*/*",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startTime;

    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    const isDirect =
      isDirectMediaExtension(parsed.pathname) ||
      contentType.startsWith("video/") ||
      contentType.includes("application/x-mpegurl") ||
      contentType.includes("vnd.apple.mpegurl");

    return new Response(
      JSON.stringify({
        ok: res.ok || res.status === 206,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        contentType,
        isDirectMedia: isDirect,
        isIframeEmbed: !isDirect && contentType.includes("text/html"),
        isMega: false,
        acceptRanges: res.headers.get("accept-ranges") === "bytes" || res.status === 206,
        contentLength: res.headers.get("content-length")
          ? parseInt(res.headers.get("content-length")!, 10)
          : null,
        contentRange: res.headers.get("content-range") || null,
        serverHeader: res.headers.get("server") || null,
        corsHeader: res.headers.get("access-control-allow-origin") || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (e: unknown) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }
}
