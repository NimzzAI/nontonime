/**
 * Streaming Providers Configuration & Handling Registry.
 *
 * Defines mapping of streaming provider keys to their base URLs, active status,
 * domain matchers, and embed/stream handling logic.
 */

export interface ScrapedLink {
  id?: string;
  url?: string;
  playUrl?: string;
  provider?: string;
  host?: string;
  quality?: string;
  kind?: string;
  episode?: number | null;
  filename?: string | null;
  mode?: string;
  [key: string]: unknown;
}

export interface StreamingProviderConfig {
  key: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
  category: "stream" | "download" | "hybrid";
  domains: string[];
  priority: number;
  match: (input: string | ScrapedLink) => boolean;
  resolveEmbedUrl?: (rawUrl: string) => string;
}

export interface AssociatedProviderLink extends ScrapedLink {
  providerKey: string;
  providerName: string;
  providerBaseUrl: string;
  isActive: boolean;
  resolvedStreamUrl: string;
}

export const STREAMING_PROVIDERS: Record<string, StreamingProviderConfig> = {
  streamwish: {
    key: "streamwish",
    name: "Streamwish",
    baseUrl: "https://streamwish.to",
    isActive: true,
    category: "stream",
    domains: [
      "streamwish.to",
      "streamwish.top",
      "streamwish.com",
      "strwish.com",
      "wishfast.top",
      "awish.pro",
    ],
    priority: 10,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /streamwish|strwish|wishfast|awish/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/e/")) return rawUrl;
      const id = rawUrl.split("/").filter(Boolean).pop();
      return id ? `https://streamwish.to/e/${id}` : rawUrl;
    },
  },

  filelions: {
    key: "filelions",
    name: "FileLions",
    baseUrl: "https://filelions.to",
    isActive: true,
    category: "stream",
    domains: ["filelions.to", "filelions.online", "filelions.site", "lionplayer.com"],
    priority: 9,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /filelion|lionplayer/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/v/")) return rawUrl;
      const id = rawUrl.split("/").filter(Boolean).pop();
      return id ? `https://filelions.to/v/${id}` : rawUrl;
    },
  },

  vidhide: {
    key: "vidhide",
    name: "VidHide",
    baseUrl: "https://vidhidepro.com",
    isActive: true,
    category: "stream",
    domains: ["vidhidepro.com", "vidhide.com", "vidhideplus.com", "callistanise.com"],
    priority: 9,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /vidhide|callistanise/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/v/")) return rawUrl;
      const id = rawUrl.split("/").filter(Boolean).pop();
      return id ? `https://vidhidepro.com/v/${id}` : rawUrl;
    },
  },

  doodstream: {
    key: "doodstream",
    name: "Doodstream",
    baseUrl: "https://doodstream.com",
    isActive: true,
    category: "stream",
    domains: ["doodstream.com", "dood.to", "dood.so", "dood.ws", "dood.re", "ds2play.com"],
    priority: 8,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /dood/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/e/")) return rawUrl;
      return rawUrl.replace("/d/", "/e/");
    },
  },

  mp4upload: {
    key: "mp4upload",
    name: "MP4Upload",
    baseUrl: "https://www.mp4upload.com",
    isActive: true,
    category: "hybrid",
    domains: ["mp4upload.com"],
    priority: 8,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /mp4upload/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/embed-")) return rawUrl;
      const id = rawUrl
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/\.html?$/i, "");
      return id ? `https://www.mp4upload.com/embed-${id}.html` : rawUrl;
    },
  },

  megaplay: {
    key: "megaplay",
    name: "MegaPlay",
    baseUrl: "https://megaplay.buzz",
    isActive: true,
    category: "stream",
    domains: ["megaplay.buzz"],
    priority: 10,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /megaplay/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  vidnest: {
    key: "vidnest",
    name: "VidNest",
    baseUrl: "https://vidnest.fun",
    isActive: true,
    category: "stream",
    domains: ["vidnest.fun"],
    priority: 9,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /vidnest/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  tryembed: {
    key: "tryembed",
    name: "TryEmbed",
    baseUrl: "https://tryembed.us.cc",
    isActive: true,
    category: "stream",
    domains: ["tryembed.us.cc", "tryembed.com"],
    priority: 9,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /tryembed/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  blogger: {
    key: "blogger",
    name: "Blogger / UserVideo",
    baseUrl: "https://www.blogger.com",
    isActive: true,
    category: "stream",
    domains: ["blogger.com", "blogspot.com", "uservideo.xyz", "storages.animein"],
    priority: 10,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /blogger|blogspot|uservideo|storages\.animein/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  gdrive: {
    key: "gdrive",
    name: "Google Drive",
    baseUrl: "https://drive.google.com",
    isActive: true,
    category: "hybrid",
    domains: ["drive.google.com", "docs.google.com"],
    priority: 7,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /gdrive|google\s*drive|drive\.google/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/preview")) return rawUrl;
      const fileIdMatch =
        rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch?.[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
      return rawUrl;
    },
  },

  pixeldrain: {
    key: "pixeldrain",
    name: "Pixeldrain",
    baseUrl: "https://pixeldrain.com",
    isActive: true,
    category: "hybrid",
    domains: ["pixeldrain.com"],
    priority: 8,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /pixeldrain/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      const idMatch = rawUrl.match(/\/u\/([a-zA-Z0-9_-]+)/);
      if (idMatch?.[1]) {
        return `https://pixeldrain.com/api/file/${idMatch[1]}`;
      }
      return rawUrl;
    },
  },

  acefile: {
    key: "acefile",
    name: "Acefile",
    baseUrl: "https://acefile.co",
    isActive: true,
    category: "hybrid",
    domains: ["acefile.co"],
    priority: 7,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /acefile/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (rawUrl.includes("/player/")) return rawUrl;
      const id = rawUrl.split("/").filter(Boolean).pop();
      return id ? `https://acefile.co/player/${id}` : rawUrl;
    },
  },

  krakenfiles: {
    key: "krakenfiles",
    name: "Krakenfiles",
    baseUrl: "https://krakenfiles.com",
    isActive: true,
    category: "download",
    domains: ["krakenfiles.com"],
    priority: 6,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /krakenfile/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  mediafire: {
    key: "mediafire",
    name: "MediaFire",
    baseUrl: "https://www.mediafire.com",
    isActive: true,
    category: "download",
    domains: ["mediafire.com"],
    priority: 7,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /mediafire/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  turbovid: {
    key: "turbovid",
    name: "TurboVid",
    baseUrl: "https://turbovid.eu",
    isActive: true,
    category: "stream",
    domains: ["turbovid.eu", "turbovid.me"],
    priority: 7,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /turbovid/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  nimegami: {
    key: "nimegami",
    name: "Nimegami Stream",
    baseUrl: "https://nimegami.id",
    isActive: true,
    category: "hybrid",
    domains: [
      "nimegami.id",
      "berkasdrive.com",
      "vsys-srv.berkasdrive.com",
      "direct-stor.berkasdrive.com",
    ],
    priority: 10,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /nimegami/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (
        rawUrl.includes("vsys-srv.berkasdrive.com") ||
        rawUrl.includes("berkasdrive.com") ||
        rawUrl.includes("direct-stor.berkasdrive.com")
      ) {
        return `/api/nimegami-proxy?url=${encodeURIComponent(rawUrl)}`;
      }
      return rawUrl;
    },
  },

  berkasdrive: {
    key: "berkasdrive",
    name: "BerkasDrive",
    baseUrl: "https://vsys-srv.berkasdrive.com",
    isActive: true,
    category: "hybrid",
    domains: ["berkasdrive.com", "vsys-srv.berkasdrive.com", "direct-stor.berkasdrive.com"],
    priority: 10,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /berkasdrive/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      if (
        rawUrl.includes("vsys-srv.berkasdrive.com") ||
        rawUrl.includes("berkasdrive.com") ||
        rawUrl.includes("direct-stor.berkasdrive.com")
      ) {
        return `/api/nimegami-proxy?url=${encodeURIComponent(rawUrl)}`;
      }
      return rawUrl;
    },
  },

  desudrive: {
    key: "desudrive",
    name: "DesuDrive",
    baseUrl: "https://desudrive.com",
    isActive: true,
    category: "stream",
    domains: ["desudrive.com", "desustream.net"],
    priority: 9,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /desudrive|desustream/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  komikcast: {
    key: "komikcast",
    name: "Komikcast Stream",
    baseUrl: "https://komikcast.bz",
    isActive: true,
    category: "stream",
    domains: [
      "workers-anime.berkasdrive.com",
      "video.sumantritelnologi.workers.dev",
      "komikcast.bz",
    ],
    priority: 8,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /komikcast|sumantritelnologi|workers-anime/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  racaty: {
    key: "racaty",
    name: "Racaty",
    baseUrl: "https://racaty.com",
    isActive: true,
    category: "download",
    domains: ["racaty.com", "racaty.net"],
    priority: 7,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /racaty/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  terabox: {
    key: "terabox",
    name: "TeraBox",
    baseUrl: "https://terabox.com",
    isActive: true,
    category: "download",
    domains: ["terabox.com", "1024terabox.com"],
    priority: 6,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /terabox|1024terabox/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => rawUrl,
  },

  animekita: {
    key: "animekita",
    name: "AnimeKita Storage",
    baseUrl: "https://storage.animekita.org",
    isActive: true,
    category: "stream",
    domains: ["animekita.org", "storage.animekita.org"],
    priority: 10,
    match: (input) => {
      const str =
        typeof input === "string"
          ? input
          : `${input.provider || ""} ${input.host || ""} ${input.url || ""} ${input.playUrl || ""}`;
      return /animekita/i.test(str);
    },
    resolveEmbedUrl: (rawUrl) => {
      if (!rawUrl) return "";
      return `/api/stream-proxy?url=${encodeURIComponent(rawUrl)}&ref=https%3A%2F%2Fnontonanime.id%2F`;
    },
  },
};

/**
 * Find matched provider configuration based on link object, provider name, or URL.
 */
export function getStreamingProvider(input: string | ScrapedLink): StreamingProviderConfig | null {
  if (!input) return null;

  // 1. Direct key match
  if (typeof input === "string") {
    const lower = input.toLowerCase().trim();
    if (STREAMING_PROVIDERS[lower]) {
      return STREAMING_PROVIDERS[lower];
    }
  }

  // 2. Iterate through registered providers and invoke match()
  for (const provider of Object.values(STREAMING_PROVIDERS)) {
    if (provider.match(input)) {
      return provider;
    }
  }

  // 3. Fallback check domain matching
  const targetUrl = typeof input === "string" ? input : input.playUrl || input.url || "";
  if (targetUrl) {
    try {
      const urlHost = new URL(targetUrl).hostname.toLowerCase();
      for (const provider of Object.values(STREAMING_PROVIDERS)) {
        if (provider.domains.some((d) => urlHost.includes(d.toLowerCase()))) {
          return provider;
        }
      }
    } catch {
      // not a valid URL string
    }
  }

  return null;
}

/**
 * Check if the given streaming provider is active.
 */
export function isProviderActive(input: string | ScrapedLink): boolean {
  const provider = getStreamingProvider(input);
  return provider ? provider.isActive : true; // Default to true for unknown providers unless explicitly registered as disabled
}

/**
 * Associates a raw scraped link with its configured provider, resolving embed URL and active state.
 */
export function associateProvider(link: ScrapedLink): AssociatedProviderLink {
  const provider = getStreamingProvider(link);
  const rawUrl = link.playUrl || link.url || "";
  const resolvedStreamUrl =
    provider && provider.resolveEmbedUrl ? provider.resolveEmbedUrl(rawUrl) : rawUrl;

  return {
    ...link,
    providerKey: provider?.key ?? (link.provider?.toLowerCase() || "unknown"),
    providerName: provider?.name ?? (link.provider || "Penyedia Streaming"),
    providerBaseUrl: provider?.baseUrl ?? "",
    isActive: provider ? provider.isActive : true,
    resolvedStreamUrl,
  };
}

/**
 * Extension API: register or update a streaming provider dynamically.
 */
export function registerProvider(config: StreamingProviderConfig): void {
  STREAMING_PROVIDERS[config.key.toLowerCase()] = config;
}

/**
 * Toggle active state of a provider.
 */
export function setProviderActive(key: string, isActive: boolean): void {
  const lower = key.toLowerCase();
  if (STREAMING_PROVIDERS[lower]) {
    STREAMING_PROVIDERS[lower].isActive = isActive;
  }
}

/**
 * Get all active streaming providers.
 */
export function getActiveProviders(): StreamingProviderConfig[] {
  return Object.values(STREAMING_PROVIDERS).filter((p) => p.isActive);
}
