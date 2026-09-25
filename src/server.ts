import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleStreamProxyRequest, handleStreamCheckRequest } from "./lib/stream-proxy.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(
    "H3 SWALLOWED SSR ERROR:",
    consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`),
  );
  return new Response(
    process.env.NODE_ENV !== "production"
      ? `<pre>H3 SSR ERROR: ${body}\n${String(consumeLastCapturedError())}</pre>`
      : renderErrorPage(),
    {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/api/stream-proxy") {
      return handleStreamProxyRequest(request);
    }
    if (url.pathname === "/api/stream-check") {
      return handleStreamCheckRequest(request);
    }
    if (url.pathname === "/api/ping") {
      return new Response("pong", { status: 200 });
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error("SERVER CATCH ERROR:", error);
      return new Response(
        process.env.NODE_ENV !== "production"
          ? `<pre>${String(error)}\n${(error as Error)?.stack}</pre>`
          : renderErrorPage(),
        {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
  },
};
