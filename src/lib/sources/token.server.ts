import { isInternalOrPrivateHost } from "../stream-proxy.server";
import type { ServerRef } from "./types";

const TOKEN_PREFIX = "srv1.";

export function encodeServerRef(ref: ServerRef): string {
  return TOKEN_PREFIX + Buffer.from(JSON.stringify(ref), "utf8").toString("base64url");
}

export function decodeServerRef(token: string): ServerRef | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(token.slice(TOKEN_PREFIX.length), "base64url").toString("utf8"),
    );
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (data["kind"] === "url" && typeof data["url"] === "string") {
      return { kind: "url", url: data["url"] };
    }
    if (
      data["kind"] === "nontonanimeid" &&
      typeof data["post"] === "string" &&
      typeof data["nume"] === "string" &&
      typeof data["name"] === "string" &&
      typeof data["nonce"] === "string" &&
      typeof data["ajax"] === "string" &&
      typeof data["ref"] === "string"
    ) {
      return {
        kind: "nontonanimeid",
        post: data["post"],
        nume: data["nume"],
        name: data["name"],
        nonce: data["nonce"],
        ajax: data["ajax"],
        ref: data["ref"],
      };
    }
    if (
      data["kind"] === "samehadaku" &&
      typeof data["post"] === "string" &&
      typeof data["nume"] === "string" &&
      typeof data["type"] === "string" &&
      typeof data["ref"] === "string"
    ) {
      return {
        kind: "samehadaku",
        post: data["post"],
        nume: data["nume"],
        type: data["type"],
        ref: data["ref"],
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Token datang dari browser, jadi URL di dalamnya harus publik dan berprotokol http atau https
export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL server tidak valid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Protokol server tidak didukung");
  }
  if (isInternalOrPrivateHost(url.hostname)) {
    throw new Error("Host server ditolak");
  }
  return url;
}
