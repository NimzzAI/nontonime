import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { History, Play, ArrowRight, X, Clock } from "lucide-react";
import { readHistory, removeHistory, type HistoryItem } from "@/lib/history";
import { cn } from "@/lib/utils";

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "Baru saja";
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) return "Kemarin";
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(timestamp),
  );
}

export function RecentlyWatchedSection({ className }: { className?: string }) {
  // Fetch and display the last five anime episodes the user has played
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const fetchRecent = () => {
      const allHistory = readHistory();
      // Exactly the last 5 episodes played
      setRecentItems(allHistory.slice(0, 5));
    };

    fetchRecent();
    window.addEventListener("history-updated", fetchRecent);
    window.addEventListener("storage", fetchRecent);
    return () => {
      window.removeEventListener("history-updated", fetchRecent);
      window.removeEventListener("storage", fetchRecent);
    };
  }, []);

  const handleRemove = (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeHistory(episodeId);
  };

  // If user hasn't played any episode yet, don't show or show a sleek teaser
  if (recentItems.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recently-watched-heading" className={cn("space-y-4", className)}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-xs">
            <History className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="recently-watched-heading"
                className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground"
              >
                Recently Watched
              </h2>
              <span className="rounded-full bg-primary/15 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary">
                Terakhir Ditonton
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lanjutkan tontonan dari 5 episode terakhir yang kamu putar
            </p>
          </div>
        </div>

        <Link
          to="/riwayat"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <span>Semua Riwayat</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of the last 5 played episodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {recentItems.map((item, index) => (
          <div
            key={item.episodeId}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:-translate-y-1"
          >
            {/* Poster + Thumbnail with Play Overlay */}
            <Link
              to="/watch/$episodeId"
              params={{ episodeId: item.episodeId }}
              search={{ a: item.animeId, autoplay: true }}
              className="relative aspect-[16/10] w-full overflow-hidden bg-muted block"
            >
              <img
                src={item.poster}
                alt={item.animeTitle}
                loading={index < 2 ? "eager" : "lazy"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              {/* Top relative time badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                <Clock className="h-2.5 w-2.5 text-primary" />
                <span>{formatRelativeTime(item.watchedAt)}</span>
              </div>

              {/* Quick remove button */}
              <button
                type="button"
                onClick={(e) => handleRemove(e, item.episodeId)}
                title="Hapus dari riwayat tontonan"
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all cursor-pointer backdrop-blur-xs"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Hover Centered Play Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Episode Pill */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 text-[10px]">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 font-bold text-primary-foreground shadow-xs truncate max-w-[85%]">
                  <Play className="h-2.5 w-2.5 fill-current shrink-0" />
                  <span className="truncate">{item.episodeTitle || "Episode Terakhir"}</span>
                </span>
              </div>
            </Link>

            {/* Info details */}
            <div className="p-3 flex flex-col justify-between flex-1 space-y-1.5">
              <Link
                to="/watch/$episodeId"
                params={{ episodeId: item.episodeId }}
                search={{ a: item.animeId, autoplay: true }}
                className="block"
              >
                <h3
                  title={item.animeTitle}
                  className="line-clamp-1 font-display text-xs font-bold text-card-foreground group-hover:text-primary transition-colors"
                >
                  {item.animeTitle}
                </h3>
                <p className="line-clamp-1 text-[11px] text-muted-foreground mt-0.5">
                  {item.episodeTitle}
                </p>
              </Link>

              {/* Bottom Quick Resume Link */}
              <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  <span>Lanjutkan</span>
                </span>
                <Link
                  to="/watch/$episodeId"
                  params={{ episodeId: item.episodeId }}
                  search={{ a: item.animeId, autoplay: true }}
                  className="font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Putar</span>
                  <Play className="h-2 w-2 fill-current" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
