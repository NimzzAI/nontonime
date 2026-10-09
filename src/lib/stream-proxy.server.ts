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

export function isInternalOrPrivateHost(hostname: string): boolean {
  const lower = hostname
    .toLowerCase()
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (
    lower === "localhost" ||
    lower === "0.0.0.0" ||
    lower === "::" ||
    lower === "::1" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower === "metadata.google.internal" ||
    lower === "instance-data"
  ) {
    return true;
  }
  // IPv6 loopback, link-local, unique-local, multicast, dan IPv4-mapped (::ffff:a.b.c.d)
  if (lower.includes(":")) {
    if (
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("ff")
    ) {
      return true;
    }
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) return isInternalOrPrivateHost(mapped[1]);
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(lower)) return true;
    return false;
  }
  // IPv4: 0/8, 10/8, 100.64/10 (CGNAT), 127/8, 169.254/16, 172.16/12, 192.0.0/24, 192.168/16, 198.18/15, multicast dan reserved
  const ipv4Match = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const b0 = parseInt(ipv4Match[1] ?? "0", 10);
    const b1 = parseInt(ipv4Match[2] ?? "0", 10);
    const b2 = parseInt(ipv4Match[3] ?? "0", 10);
    if (b0 === 0 || b0 === 10 || b0 === 127) return true;
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    if (b0 === 169 && b1 === 254) return true;
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    if (b0 === 192 && b1 === 0 && b2 === 0) return true;
    if (b0 === 192 && b1 === 168) return true;
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
    if (b0 >= 224) return true;
  }
  return false;
}

/**
 * Cek lanjutan: nama domain yang MENGARAH ke IP privat (misalnya domain buatan penyerang
 * yang A record-nya 127.0.0.1) lolos dari pemeriksaan teks di atas, jadi hasil DNS dicek juga.
 * Bila DNS tidak tersedia di runtime (misalnya edge), pemeriksaan ini dilewati.
 */
export async function resolvesToPrivateAddress(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (/^[\d.]+$/.test(host) || host.includes(":")) return false;
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.lookup(host, { all: true });
    return records.some((r) => isInternalOrPrivateHost(r.address));
  } catch {
    return false;
  }
}

/** Header CORS hanya untuk asal yang sama dengan situs sendiri. Pemutar memakai URL relatif, jadi tidak butuh `*`. */
export function corsOrigin(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (origin && origin === new URL(request.url).origin) {
    return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  }
  return {};
}

function isAllowedPort(port: string): boolean {
  if (!port) return true; // default 80 or 443
  const p = parseInt(port, 10);
  return p === 80 || p === 443 || p === 8080 || p === 8443 || p === 8888;
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
        ...corsOrigin(request),
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
      },
    );
  }

  if (isInternalOrPrivateHost(parsedTarget.hostname)) {
    return new Response(
      JSON.stringify({ error: "RESTRICTED_HOST", message: "Akses ke host internal ditolak" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
      },
    );
  }

  if (await resolvesToPrivateAddress(parsedTarget.hostname)) {
    return new Response(
      JSON.stringify({ error: "RESTRICTED_HOST", message: "Akses ke host internal ditolak" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
      },
    );
  }

  if (!isAllowedPort(parsedTarget.port)) {
    return new Response(
      JSON.stringify({ error: "RESTRICTED_PORT", message: "Port yang diminta tidak diizinkan" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
          headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
          headers: { "Content-Type": "application/json", ...corsOrigin(request) },
        },
      );
    }

    // Prepare response headers for client streaming
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    for (const [k, v] of Object.entries(corsOrigin(request))) responseHeaders.set(k, v);
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
      headers: { "Content-Type": "application/json", ...corsOrigin(request) },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetParam);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsOrigin(request) },
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response(JSON.stringify({ ok: false, error: "UNSUPPORTED_PROTOCOL" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsOrigin(request) },
    });
  }

  if (
    isInternalOrPrivateHost(parsed.hostname) ||
    !isAllowedPort(parsed.port) ||
    (await resolvesToPrivateAddress(parsed.hostname))
  ) {
    return new Response(JSON.stringify({ ok: false, error: "RESTRICTED_HOST" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
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
        headers: { "Content-Type": "application/json", ...corsOrigin(request) },
      },
    );
  }
}
