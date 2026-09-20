import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { HeroSlider } from "@/components/anime/HeroSlider";
import { Shelf } from "@/components/anime/Shelf";
import { ErrorState } from "@/components/anime/StateViews";
import { homeQuery, currentDayName } from "@/lib/queries";
import { readHistory, type HistoryItem } from "@/lib/history";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nontonime — Streaming Anime Subtitle Indonesia Terbaru" },
      {
        name: "description",
        content:
          "Nonton anime subtitle Indonesia terlengkap dan terupdate gratis. Streaming lancar dengan pilihan kualitas 360p, 480p, hingga 720p HD.",
      },
      { property: "og:title", content: "Nontonime — Streaming Anime Subtitle Indonesia Terbaru" },
      {
        property: "og:description",
        content:
          "Nonton anime subtitle Indonesia terlengkap dan terupdate gratis. Streaming lancar dengan berbagai pilihan server.",
      },
    ],
  }),
  component: HomePage,
});

const POPULAR_GENRES = [
  { id: "action", name: "Action", icon: "fa-solid fa-burst" },
  { id: "comedy", name: "Comedy", icon: "fa-solid fa-face-laugh-squint" },
  { id: "romance", name: "Romance", icon: "fa-solid fa-heart" },
  { id: "isekai", name: "Isekai", icon: "fa-solid fa-dungeon" },
  { id: "fantasy", name: "Fantasy", icon: "fa-solid fa-wand-magic-sparkles" },
  { id: "school", name: "School", icon: "fa-solid fa-graduation-cap" },
  { id: "shounen", name: "Shounen", icon: "fa-solid fa-fire" },
  { id: "slice-of-life", name: "Slice of Life", icon: "fa-solid fa-mug-hot" },
  { id: "supernatural", name: "Supernatural", icon: "fa-solid fa-ghost" },
  { id: "sci-fi", name: "Sci-Fi", icon: "fa-solid fa-robot" },
];

function HomePage() {
  const { data, isPending, error, refetch } = useQuery(homeQuery());
  const [continueItems, setContinueItems] = useState<HistoryItem[]>([]);
  const todayDay = currentDayName();

  useEffect(() => {
    const sync = () => setContinueItems(readHistory().slice(0, 10));
    sync();
    window.addEventListener("history-updated", sync);
    return () => window.removeEventListener("history-updated", sync);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:py-8">
      {/* Hero Section Loading / Carousel */}
      {isPending ? (
        <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-muted/60 sm:aspect-[21/9]" />
      ) : null}

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data && data.slider.length > 0 ? <HeroSlider items={data.slider.slice(0, 7)} /> : null}

      {/* Continue Watching Section */}
      {continueItems.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
              <i className="fa-solid fa-clock-rotate-left text-primary" />
              Lanjutkan Nonton
            </h2>
            <Link to="/riwayat" className="text-xs font-semibold text-primary hover:underline">
              Semua Riwayat
            </Link>
          </div>

          <div className="edge-fade no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2">
            {continueItems.map((item) => (
              <Link
                key={item.episodeId}
                to="/watch/$episodeId"
                params={{ episodeId: item.episodeId }}
                search={{ a: item.animeId }}
                className="group w-32 shrink-0 space-y-2 sm:w-40"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-sm transition group-hover:border-primary group-hover:shadow-md">
                  <img
                    src={item.poster}
                    alt={item.animeTitle}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md">
                      <i className="fa-solid fa-play ml-0.5 text-xs" />
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 inset-x-1.5 rounded-lg bg-black/70 px-1.5 py-0.5 text-center text-[10px] font-bold text-white backdrop-blur-xs truncate">
                    Lanjut
                  </div>
                </div>
                <p className="line-clamp-1 text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {item.animeTitle}
                </p>
                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                  {item.episodeTitle}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Popular Genres Quick Navigation Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
            <i className="fa-solid fa-tags text-primary" />
            Jelajahi Genre
          </h2>
          <Link to="/genre" className="text-xs font-semibold text-primary hover:underline">
            Semua Genre
          </Link>
        </div>
        <div className="edge-fade no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {POPULAR_GENRES.map((g) => (
            <Link
              key={g.id}
              to="/genre/$genreId"
              params={{ genreId: g.id }}
              className="press-soft flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs hover:border-primary hover:bg-accent shrink-0"
            >
              <i className={`${g.icon} text-primary text-[11px]`} />
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Ongoing / Tayang Section */}
      <Shelf
        title={`Tayang Hari ${todayDay}`}
        icon="fa-solid fa-calendar-day"
        items={data?.today ?? []}
        isLoading={isPending}
        viewAllTo="/jadwal"
      />

      <Shelf
        title="Sedang Tayang (Ongoing)"
        icon="fa-solid fa-tower-broadcast"
        items={data?.hot ?? []}
        isLoading={isPending}
        viewAllTo="/ongoing"
        viewAllSearch={{ page: 1 }}
      />

      <Shelf
        title="Anime Tamat Terbaru (Completed)"
        icon="fa-solid fa-circle-check"
        items={data?.popular ?? []}
        isLoading={isPending}
        viewAllTo="/tamat"
        viewAllSearch={{ page: 1 }}
      />

      <Shelf
        title="Rekomendasi Pilihan"
        icon="fa-solid fa-fire"
        items={data?.new ?? []}
        isLoading={isPending}
      />

      {/* Platform Features Highlight */}
      <section className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xs">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <i className="fa-solid fa-bolt text-lg" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-foreground">Streaming Cepat</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pemutar video responsif dengan multi-server OtakuWatch, OdStream, VidHide, & Mega.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <i className="fa-solid fa-film text-lg" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-foreground">Kualitas Fleksibel</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pilih resolusi 360p hemat kuota, 480p seimbang, hingga 720p HD jernih.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <i className="fa-solid fa-calendar-check text-lg" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-foreground">Jadwal Rilis Tepat</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Katalog anime rilis mingguan selalu disinkronkan setiap hari Senin s/d Minggu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <i className="fa-solid fa-bookmark text-lg" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-foreground">Simpan & Riwayat</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tandai anime favorit dan lacak episode terakhir yang ditonton secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
