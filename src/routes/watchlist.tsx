import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SectionTitle } from "@/components/anime/StateViews";
import { readWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — Nontonime" },
      { name: "description", content: "Anime yang kamu simpan untuk ditonton nanti." },
      { property: "og:title", content: "Watchlist — Nontonime" },
      { property: "og:description", content: "Anime yang kamu simpan untuk ditonton nanti." },
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
      <SectionTitle title="Watchlist" icon="fa-solid fa-bookmark" />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <i className="fa-solid fa-bookmark text-2xl text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada anime yang disimpan. Buka halaman detail anime lalu tekan tombol simpan.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Jelajahi anime
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div key={item.animeId} className="group relative">
              <Link
                to="/anime/$animeId"
                params={{ animeId: item.animeId }}
                className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[2/3] overflow-hidden bg-muted">
                  <img src={item.poster} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
                    {item.title}
                  </h3>
                </div>
              </Link>
              <button
                onClick={() => removeFromWatchlist(item.animeId)}
                aria-label="Hapus dari watchlist"
                className="glass absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-foreground"
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
