import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SectionTitle } from "@/components/anime/StateViews";
import { readWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist Saya — Nontonime" },
      {
        name: "description",
        content: "Daftar anime yang disimpan untuk ditonton nanti di Nontonime.",
      },
      { property: "og:title", content: "Watchlist Saya — Nontonime" },
      {
        property: "og:description",
        content: "Daftar anime yang disimpan untuk ditonton nanti di Nontonime.",
      },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readWatchlist());
    sync();
    window.addEventListener("watchlist-updated", sync);
    return () => window.removeEventListener("watchlist-updated", sync);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <SectionTitle title="Watchlist Saya" icon="fa-solid fa-bookmark" />
        {items.length > 0 ? (
          <span className="text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-1 rounded-full">
            {items.length} Anime
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 px-6 py-16 text-center space-y-3 backdrop-blur-xs">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <i className="fa-solid fa-bookmark text-xl" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">
            Belum ada anime yang disimpan
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Temukan anime favoritmu lalu klik tombol bookmark untuk menyimpannya ke daftar tontonan
            ini.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <i className="fa-solid fa-compass" />
              Jelajahi Beranda
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div key={item.animeId} className="group relative">
              <Link
                to="/anime/$animeId"
                params={{ animeId: item.animeId }}
                className="card-lift block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/50"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <i className="fa-solid fa-film text-xl" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      <i className="fa-solid fa-play ml-0.5 text-xs" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFromWatchlist(item.animeId);
                }}
                aria-label="Hapus dari watchlist"
                title="Hapus dari watchlist"
                className="press-soft glass absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:text-destructive hover:bg-destructive/20 transition-colors shadow-xs"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
