import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { HeroSlider } from "@/components/anime/HeroSlider";
import { Shelf } from "@/components/anime/Shelf";
import { ErrorState } from "@/components/anime/StateViews";
import { homeQuery } from "@/lib/queries";
import { readHistory, type HistoryItem } from "@/lib/history";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nontonime — Nonton Anime Subtitle Indonesia" },
      {
        name: "description",
        content:
          "Streaming anime ongoing dan tamat dengan subtitle Indonesia. Jadwal rilis, genre, dan riwayat tontonan tanpa perlu akun.",
      },
      { property: "og:title", content: "Nontonime — Nonton Anime Subtitle Indonesia" },
      {
        property: "og:description",
        content:
          "Streaming anime ongoing dan tamat dengan subtitle Indonesia. Jadwal rilis, genre, dan riwayat tontonan tanpa perlu akun.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data, isPending, error, refetch } = useQuery(homeQuery());
  const [continueItems, setContinueItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const sync = () => setContinueItems(readHistory().slice(0, 10));
    sync();
    window.addEventListener("history-updated", sync);
    return () => window.removeEventListener("history-updated", sync);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:py-8">
      {isPending ? (
        <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-muted sm:aspect-[21/9]" />
      ) : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data && data.slider.length > 0 ? <HeroSlider items={data.slider.slice(0, 6)} /> : null}

      {continueItems.length > 0 ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            <i className="fa-solid fa-clock-rotate-left text-primary" />
            Lanjutkan Nonton
          </h2>
          <div className="edge-fade no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {continueItems.map((item) => (
              <Link
                key={item.episodeId}
                to="/watch/$episodeId"
                params={{ episodeId: item.episodeId }}
                search={{ a: item.animeId }}
                className="group w-32 shrink-0 space-y-2 sm:w-40"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border bg-muted">
                  <img
                    src={item.poster}
                    alt={item.animeTitle}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/0 transition-colors group-hover:bg-background/40">
                    <i className="fa-solid fa-play text-lg text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                <p className="line-clamp-2 text-xs font-medium text-card-foreground">{item.animeTitle}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Shelf
        title="Tayang Hari Ini"
        icon="fa-solid fa-tower-broadcast"
        items={data?.today ?? []}
        isLoading={isPending}
        viewAllTo="/ongoing"
        viewAllSearch={{ page: 1 }}
      />
      <Shelf title="Trending" icon="fa-solid fa-fire" items={data?.hot ?? []} isLoading={isPending} />
      <Shelf
        title="Terpopuler"
        icon="fa-solid fa-ranking-star"
        items={data?.popular ?? []}
        isLoading={isPending}
      />
      <Shelf
        title="Baru Ditambahkan"
        icon="fa-solid fa-sparkles"
        items={data?.new ?? []}
        isLoading={isPending}
      />
      <Shelf
        title="Segera Tayang"
        icon="fa-solid fa-hourglass-half"
        items={data?.waiting ?? []}
        isLoading={isPending}
      />
    </div>
  );
}
