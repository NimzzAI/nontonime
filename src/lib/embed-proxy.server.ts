export async function handleEmbedProxyRequest(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get("url") || "";
  const referer = reqUrl.searchParams.get("ref") || "";

  if (!targetUrl) {
    return new Response("Missing target url parameter", { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response("Invalid protocol", { status: 400 });
    }

    const effectiveReferer =
      referer ||
      (parsed.hostname.includes("megaplay") || parsed.hostname.includes("aniwatch")
        ? "https://aniwatch.cx/"
        : `${parsed.origin}/`);

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: effectiveReferer,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    const contentType = upstream.headers.get("content-type") || "text/html";
    if (!contentType.includes("text/html")) {
      const buffer = await upstream.arrayBuffer();
      return new Response(buffer, {
        status: upstream.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    let html = await upstream.text();

    // Special handling for Aniwatch episode page: extract the clean player stream if present
    if (parsed.hostname.includes("aniwatch.cx") && parsed.pathname.includes("/episode/")) {
      const hianimeMatch = html.match(/currentHianimeEpId\s*=\s*['"]([^'"]+)['"]/);
      let epId = "";
      if (hianimeMatch?.[1]) {
        try {
          epId =
            Buffer.from(hianimeMatch[1].replace(/-/g, "+").replace(/_/g, "/"), "base64")
              .toString("utf8")
              .split(":")[0] || "";
        } catch {
          // ignore token decode error
        }
      }

      const anilistMatch = html.match(/anilistId\s*=\s*(\d+)/);
      const anilistId = anilistMatch?.[1];
      const epNumMatch =
        (parsed.pathname.match(/-(\d+)-/) ?? parsed.pathname.match(/-(\d+)$/))?.[1] ?? "1";

      const playerUrl = epId
        ? `https://megaplay.buzz/stream/s-2/${epId}/sub`
        : anilistId
          ? `https://vidnest.fun/anime/${anilistId}/${epNumMatch}/sub`
          : null;

      if (playerUrl && !reqUrl.searchParams.has("raw")) {
        // Return a sleek, modern responsive wrapper embedding the real player
        const cleanPlayerHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aniwatch Player Bypass</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <iframe
    src="${playerUrl}"
    allowfullscreen
    allow="autoplay; encrypted-media; fullscreen"
    referrerpolicy="origin"
  ></iframe>
</body>
</html>`;
        return new Response(cleanPlayerHtml, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "X-Frame-Options": "ALLOWALL",
            "Cache-Control": "public, max-age=1800",
          },
        });
      }
    }

    // 1. Inject base tag so relative URLs (/lib/..., /images/...) resolve to target origin
    const baseTag = `<base href="${parsed.origin}/">`;
    if (html.includes("<head")) {
      html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
    } else {
      html = baseTag + html;
    }

    // 2. Remove all frame-busting scripts (top !== self, window.top, top.location)
    html = html.replace(
      /<script[^>]*>[\s\S]*?(?:top\.location|window\.top|self\s*!==\s*top)[\s\S]*?<\/script>/gi,
      "",
    );
    html = html.replace(
      /if\s*\(\s*(?:window\.)?top\s*!==\s*(?:window\.)?self\s*\)\s*\{?[^}]*\}?/gi,
      "",
    );
    html = html.replace(/window\.top\.location(?:\.href)?\s*=\s*[^;]+;/gi, "");
    html = html.replace(/top\.location(?:\.href)?\s*=\s*[^;]+;/gi, "");

    // 3. Disable MegaPlay SandboxDetector checks
    html = html.replace(
      /const n="Opss! Sandboxed our player is not allowed[^;]+;/gi,
      'const n="";',
    );
    html = html.replace(/Opss! Sandboxed our player is not allowed[^\n\r"']*/gi, "");

    // 4. Inject document.referrer override script so inner player scripts make requests with proper referer
    const helperScript = `
<script>
  try {
    Object.defineProperty(document, 'referrer', {
      get: function() { return ${JSON.stringify(effectiveReferer)}; },
      configurable: true
    });
  } catch(e) {}
</script>
`;
    html = html.replace(/<head[^>]*>/i, `$&${helperScript}`);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "X-Frame-Options": "ALLOWALL",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err) {
    return new Response(
      `<div style="color:#fff;background:#000;padding:20px;font-family:sans-serif;text-align:center;">
        <h3>Gagal memuat embed video</h3>
        <p>${err instanceof Error ? err.message : "Network error"}</p>
      </div>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}
