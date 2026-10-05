/**
 * Provider Configuration & Helper.
 * Katalog nontonime sekarang digabung dari beberapa sumber scraper, lihat src/lib/sources.
 * Konstanta provider di bawah dipertahankan supaya pemanggil lama tetap jalan.
 */

export type AnimeProvider = "otakudesu";

export interface ProviderMeta {
  id: AnimeProvider;
  name: string;
  badge: string;
  shortName: string;
  description: string;
  accentClass: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "otakudesu",
    name: "Otakudesu",
    badge: "Otaku",
    shortName: "Otakudesu",
    description:
      "Katalog anime subtitle Indonesia yang digabung dari beberapa sumber, dengan rilis harian dan banyak pilihan server",
    accentClass: "text-primary bg-primary/10 border-primary/30",
  },
];

export function getStoredProvider(): AnimeProvider {
  return "otakudesu";
}

export function setStoredProvider(_provider: AnimeProvider): void {
  // Single-provider lock: Otakudesu
}

/**
 * React hook for provider metadata.
 */
export function useAnimeProvider() {
  const meta = PROVIDERS[0];
  return {
    provider: "otakudesu" as const,
    setProvider: (_p: AnimeProvider) => {},
    toggleProvider: () => {},
    meta,
    isSamehadaku: false,
    isOtakudesu: true,
  };
}
