import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { HeroSlider } from "@/components/anime/HeroSlider";
import { TrendingSlider } from "@/components/anime/TrendingSlider";
import { Shelf } from "@/components/anime/Shelf";
import { ErrorState } from "@/components/anime/StateViews";
import { AnimeGachaModal } from "@/components/anime/AnimeGachaModal";
import { WelcomeModal } from "@/components/anime/WelcomeModal";
import { FloatingTools } from "@/components/anime/FloatingTools";
import { SearchFilterPanel } from "@/components/anime/SearchFilterPanel";
import { RecentlyWatchedSection } from "@/components/anime/RecentlyWatchedSection";
import { homeQuery, currentDayName } from "@/lib/queries";
import {
  ArrowRight,
  Bookmark,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Dices,
  Film,
  Flame,
  History,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(homeQuery());
    } catch {
      // In case of transient network error during SSR prefetch, let client query handle fallback
    }
  },
  head: () => ({
    meta: [
      { title: "Nontonime: Streaming Anime Subtitle Indonesia Terbaru" },
      {
        name: "description",
        content:
          "Nonton anime subtitle Indonesia terlengkap dan terupdate gratis. Streaming lancar dengan pilihan kualitas 360p, 480p, hingga 720p HD.",
      },
      { property: "og:title", content: "Nontonime: Streaming Anime Subtitle Indonesia Terbaru" },
      {
        property: "og:description",
        content:
          "Nonton anime subtitle Indonesia terlengkap dan terupdate gratis. Streaming lancar dengan berbagai pilihan server.",
      },
    ],
  }),
  component: HomePage,
});

// Clean text-only popular genres (strictly no font-awesome icons)
const POPULAR_GENRES = [
  { id: "action", name: "Action" },
  { id: "isekai", name: "Isekai" },
  { id: "fantasy", name: "Fantasy" },
  { id: "romance", name: "Romance" },
  { id: "comedy", name: "Comedy" },
  { id: "shounen", name: "Shounen" },
  { id: "adventure", name: "Adventure" },
  { id: "slice-of-life", name: "Slice of Life" },
  { id: "supernatural", name: "Supernatural" },
  { id: "sci-fi", name: "Sci-Fi" },
  { id: "mystery", name: "Mystery" },
  { id: "drama", name: "Drama" },
  { id: "school", name: "School" },
  { id: "sports", name: "Sports" },
];

function HomePage() {
  const { data, isPending, error, refetch } = useQuery(homeQuery());
  const [gachaOpen, setGachaOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const todayDay = currentDayName();

  return (
    <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 py-4 sm:py-6">
      {/* Welcome & Site Introduction Popup Modal */}
      <WelcomeModal />

      {/* Stream Curation & Broadcast Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/90 px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">
            Tayang Hari Ini ({todayDay}) : Update Episode Sub Indo Otomatis
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <span>Filter Anime</span>
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-welcome-modal"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
          >
            <span>Panduan & Info</span>
          </button>
        </div>
      </div>

      {/* Hero Section Loading / Carousel */}
      {isPending ? (
        <div className="aspect-[16/9] w-full animate-pulse rounded-2xl sm:rounded-3xl bg-muted/60 sm:aspect-[21/9]" />
      ) : null}

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data && data.slider.length > 0 ? <HeroSlider items={data.slider.slice(0, 7)} /> : null}

      {/* High-Quality Trending Anime Horizontal Slider */}
      {data && (data.hot.length > 0 || data.slider.length > 0) ? (
        <TrendingSlider
          items={data.hot.length > 0 ? data.hot.slice(0, 10) : data.slider.slice(0, 10)}
        />
      ) : null}

      {/* Interactive Surprise Anime Roulette Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
              <Dices className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
                Bingung Mau Nonton Apa Hari Ini?
              </h3>
              <p className="text-xs text-muted-foreground leading-snug">
                Putar roda roulette takdir anime dan temukan serial menarik berikutnya secara instan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGachaOpen(true)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <Dices className="h-4 w-4" />
            <span>Putar Anime Acak</span>
          </button>
        </div>
      </section>

      {/* Recently Watched Section */}
      <RecentlyWatchedSection />

      {/* Popular Genres Quick Navigation Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
              Jelajahi Berdasarkan Genre
            </h2>
            <p className="text-xs text-muted-foreground">
              Pilih kategori favorit untuk menemukan anime pilihan terbaik
            </p>
          </div>
          <Link
            to="/genre"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <span>Semua Genre</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="edge-fade no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          {POPULAR_GENRES.map((g) => (
            <Link
              key={g.id}
              to="/genre/$genreId"
              params={{ genreId: g.id }}
              search={{ page: 1, name: g.name }}
              className="inline-flex h-8 shrink-0 items-center rounded-lg border border-border/80 bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-secondary hover:text-primary active:scale-95 shadow-2xs"
            >
              {g.name}
            </Link>
          ))}
          <Link
            to="/genre"
            className="inline-flex h-8 shrink-0 items-center rounded-lg border border-dashed border-border bg-secondary/40 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-secondary"
          >
            +30 Genre Lainnya
          </Link>
        </div>
      </section>

      {/* Ongoing / Tayang Section */}
      <Shelf
        title={`Tayang Hari ${todayDay}`}
        icon={CalendarDays}
        items={data?.today ?? []}
        isLoading={isPending}
        viewAllTo="/jadwal"
      />

      <Shelf
        title="Sedang Tayang (Ongoing)"
        icon={Flame}
        items={data?.hot ?? []}
        isLoading={isPending}
        viewAllTo="/ongoing"
        viewAllSearch={{ page: 1 }}
      />

      <Shelf
        title="Anime Tamat Terbaru (Completed)"
        icon={CheckCircle2}
        items={data?.popular ?? []}
        isLoading={isPending}
        viewAllTo="/tamat"
        viewAllSearch={{ page: 1 }}
      />

      <Shelf
        title="Rekomendasi Pilihan"
        icon={Film}
        items={data?.new ?? []}
        isLoading={isPending}
      />

      {/* Platform Features Highlight */}
      <section className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xs">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-xs sm:text-sm font-bold text-foreground">
                Streaming Cepat
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pemutar video responsif dengan multi-server OtakuWatch, OdStream, VidHide, & Mega.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Film className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-xs sm:text-sm font-bold text-foreground">
                Kualitas Fleksibel
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pilih resolusi 360p hemat kuota, 480p seimbang, hingga 720p HD jernih.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-xs sm:text-sm font-bold text-foreground">
                Jadwal Rilis Tepat
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Katalog anime rilis mingguan selalu disinkronkan setiap hari Senin s/d Minggu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-xs sm:text-sm font-bold text-foreground">
                Simpan & Riwayat
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tandai anime favorit dan lacak episode terakhir yang ditonton secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Quick Tools (Scroll to Top, Gacha, Filter) */}
      <FloatingTools onOpenFilter={() => setFilterOpen(true)} />

      {/* Anime Gacha Roulette Modal */}
      <AnimeGachaModal open={gachaOpen} onOpenChange={setGachaOpen} />

      {/* Filter Drawer Panel */}
      <SearchFilterPanel open={filterOpen} onOpenChange={setFilterOpen} />
    </div>
  );
}
