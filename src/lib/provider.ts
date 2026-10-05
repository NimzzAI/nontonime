/**
 * Provider Configuration & Helper.
<<<<<<< HEAD
 * Katalog nontonime sekarang digabung dari beberapa sumber scraper, lihat src/lib/sources.
 * Konstanta provider di bawah dipertahankan supaya pemanggil lama tetap jalan.
=======
 * Nontonime standardizes on Otakudesu as the primary streaming & catalogue provider.
>>>>>>> 29d30b74a34c4b8e1a20df21d47e03c7dd54e479
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
<<<<<<< HEAD
      "Katalog anime subtitle Indonesia yang digabung dari beberapa sumber, dengan rilis harian dan banyak pilihan server",
=======
      "Koleksi anime subtitle Indonesia terlengkap, update rilis harian, dan navigasi episode stabil",
>>>>>>> 29d30b74a34c4b8e1a20df21d47e03c7dd54e479
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
