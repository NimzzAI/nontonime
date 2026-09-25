import { useState, useEffect } from "react";

export type AnimeProvider = "otakudesu" | "samehadaku";

export interface ProviderMeta {
  id: AnimeProvider;
  name: string;
  badge: string;
  shortName: string;
  description: string;
  accentClass: string;
  icon: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "otakudesu",
    name: "Otakudesu",
    badge: "Otaku",
    shortName: "Otakudesu",
    description: "Server cepat, update rilis harian, dan navigasi episode stabil",
    accentClass: "text-primary bg-primary/10 border-primary/30",
    icon: "fa-solid fa-play",
  },
  {
    id: "samehadaku",
    name: "Samehadaku",
    badge: "Samehadaku HD",
    shortName: "Samehadaku",
    description: "Pilihan resolusi 1080p & 4K, mode x265 hemat kuota, dan koleksi movie lengkap",
    accentClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    icon: "fa-solid fa-bolt",
  },
];

const STORAGE_KEY = "nonton-anime-provider";

export function getStoredProvider(): AnimeProvider {
  if (typeof window === "undefined") return "otakudesu";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const p = urlParams.get("provider") || urlParams.get("src");
    if (p === "samehadaku" || p === "otakudesu") return p;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "samehadaku" || stored === "otakudesu") return stored;
  } catch {
    // no-op
  }
  return "otakudesu";
}

export function setStoredProvider(provider: AnimeProvider): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, provider);
    window.dispatchEvent(
      new CustomEvent("nonton-provider-changed", { detail: { provider } }),
    );
  } catch {
    // no-op
  }
}

/**
 * React hook to listen and toggle between Anime providers (Otakudesu <-> Samehadaku).
 */
export function useAnimeProvider() {
  const [provider, setProviderState] = useState<AnimeProvider>("otakudesu");

  useEffect(() => {
    setProviderState(getStoredProvider());

    const handleChanged = (e: Event) => {
      const custom = e as CustomEvent<{ provider: AnimeProvider }>;
      if (custom.detail?.provider) {
        setProviderState(custom.detail.provider);
      } else {
        setProviderState(getStoredProvider());
      }
    };

    window.addEventListener("nonton-provider-changed", handleChanged);
    window.addEventListener("storage", handleChanged);

    return () => {
      window.removeEventListener("nonton-provider-changed", handleChanged);
      window.removeEventListener("storage", handleChanged);
    };
  }, []);

  const switchProvider = (next: AnimeProvider) => {
    setProviderState(next);
    setStoredProvider(next);
  };

  const toggleProvider = () => {
    const next = provider === "otakudesu" ? "samehadaku" : "otakudesu";
    switchProvider(next);
  };

  const meta = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  return {
    provider,
    setProvider: switchProvider,
    toggleProvider,
    meta,
    isSamehadaku: provider === "samehadaku",
    isOtakudesu: provider === "otakudesu",
  };
}
