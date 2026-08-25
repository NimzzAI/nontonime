import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { ErrorState, LoadingState, SectionTitle } from "@/components/anime/StateViews";
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
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary to-card p-8 shadow-sm">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          {/* TODO: taruh file video kamu di public/hero-bg.mp4, source di bawah otomatis kepakai kalau filenya ada */}
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/75 to-background/50" />
        <div className="relative">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Nonton anime subtitle Indonesia
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Katalog anime ongoing dan tamat, jadwal rilis mingguan, serta riwayat tontonan yang
            tersimpan langsung di perangkat kamu. Tanpa akun, tanpa ribet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/ongoing"
              search={{ page: 1 }}
              className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <i className="fa-solid fa-tower-broadcast" />
              Anime Ongoing
            </Link>
            <Link
              to="/jadwal"
              className="press-soft inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <i className="fa-solid fa-calendar-days" />
              Jadwal Rilis
            </Link>
          </div>
        </div>
      </section>

      {continueItems.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle title="Lanjutkan Nonton" icon="fa-solid fa-clock-rotate-left" />
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {continueItems.map((item) => (
              <Link
                key={item.episodeId}
                to="/watch/$episodeId"
                params={{ episodeId: item.episodeId }}
                className="group w-32 shrink-0 space-y-2"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-muted">
                  <img
                    src={item.poster}
                    alt={item.animeTitle}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/0 transition-colors group-hover:bg-background/30">
                    <i className="fa-solid fa-play text-lg text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                <p className="line-clamp-2 text-xs font-medium text-card-foreground">{item.animeTitle}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data ? (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle title="Sedang Tayang" icon="fa-solid fa-tower-broadcast" />
              <Link to="/ongoing" search={{ page: 1 }} className="text-sm font-medium text-primary hover:underline">
                Lihat semua
              </Link>
            </div>
            <AnimeGrid items={data.data.ongoing?.animeList ?? []} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle title="Baru Tamat" icon="fa-solid fa-circle-check" />
              <Link to="/tamat" search={{ page: 1 }} className="text-sm font-medium text-primary hover:underline">
                Lihat semua
              </Link>
            </div>
            <AnimeGrid items={data.data.completed?.animeList ?? []} />
          </section>
        </>
      ) : null}
    </div>
  );
}
