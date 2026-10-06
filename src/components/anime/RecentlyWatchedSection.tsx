import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { History, Play, ArrowRight, X, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { readHistory, removeHistory, type HistoryItem } from "@/lib/history";
import { readWatchlist } from "@/lib/watchlist";
import { cn } from "@/lib/utils";
import { getSafePosterUrl, cleanToHdPosterUrl } from "@/lib/poster";

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

function formatTime(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function RecentlyWatchedSection({ className }: { className?: string }) {
  const [continueItems, setContinueItems] = useState<HistoryItem[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchContinueWatching = () => {
      const allHistory = readHistory();
      // Up to 6 in-progress episodes
      setContinueItems(allHistory.slice(0, 6));
    };

    fetchContinueWatching();
    window.addEventListener("history-updated", fetchContinueWatching);
    window.addEventListener("watchlist-updated", fetchContinueWatching);
    window.addEventListener("storage", fetchContinueWatching);
    return () => {
      window.removeEventListener("history-updated", fetchContinueWatching);
      window.removeEventListener("watchlist-updated", fetchContinueWatching);
      window.removeEventListener("storage", fetchContinueWatching);
    };
  }, []);

  const handleRemove = (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeHistory(episodeId);
  };

  // If user hasn't played anything yet, show a sleek starter teaser
  if (continueItems.length === 0) {
    if (isDismissed) return null;
    return (
      <section aria-labelledby="continue-watching-heading" className={cn("space-y-4", className)}>
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-primary/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-xs">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2
                    id="continue-watching-heading"
                    className="font-display text-sm sm:text-base font-bold text-foreground"
                  >
                    Lanjutkan Menonton
                  </h2>
                  <span className="rounded-full bg-primary/15 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Otomatis Tersimpan
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Setiap kali kamu memutar anime, progres menit dan episode akan otomatis tercatat
                  di sini sehingga kamu bisa langsung melanjutkan kapan saja.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <a
                href="#popular-shelf"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-xs cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Mulai Menonton</span>
              </a>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                title="Tutup panduan ini"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="continue-watching-heading" className={cn("space-y-4", className)}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="continue-watching-heading"
                className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground"
              >
                Lanjutkan Menonton
              </h2>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sedang Berjalan
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lanjutkan tontonan dari {continueItems.length} episode terakhir yang kamu putar
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

      {/* Grid of In-Progress Episodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {continueItems.map((item, index) => {
          const rawDuration = item.duration || 1440;
          const rawCurrent = item.currentTime || 0;
          const percent =
            typeof item.progressPercent === "number" && item.progressPercent > 0
              ? item.progressPercent
              : rawDuration > 0
                ? Math.min(100, Math.max(5, Math.round((rawCurrent / rawDuration) * 100)))
                : 20;

          const posterUrl = getSafePosterUrl(cleanToHdPosterUrl(item.poster), item.animeTitle);

          return (
            <div
              key={item.episodeId}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:-translate-y-1"
            >
              {/* HD Thumbnail with Play Overlay & Progress Bar */}
              <Link
                to="/watch/$episodeId"
                params={{ episodeId: item.episodeId }}
                search={{ a: item.animeId, autoplay: true }}
                className="relative aspect-[16/10] w-full overflow-hidden bg-muted block isolate"
              >
                <img
                  src={posterUrl}
                  alt={item.animeTitle}
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dark Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Top time badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-medium text-white/95">
                  <Clock className="h-2.5 w-2.5 text-primary" />
                  <span>{formatRelativeTime(item.watchedAt)}</span>
                </div>

                {/* Quick remove button */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, item.episodeId)}
                  title="Hapus dari daftar lanjutkan menonton"
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all cursor-pointer backdrop-blur-xs z-20"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Bottom Episode Label + Time Tracker */}
                <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-1.5 py-0.5 font-bold text-white shadow-xs truncate max-w-[65%]">
                    <span className="truncate">{item.episodeTitle || "Episode"}</span>
                  </span>

                  {rawCurrent > 0 ? (
                    <span className="rounded-md bg-primary/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      {formatTime(rawCurrent)} / {formatTime(rawDuration)}
                    </span>
                  ) : (
                    <span className="rounded-md bg-primary/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      {percent}%
                    </span>
                  )}
                </div>

                {/* High-Visibility Bottom Red Progress Bar */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-rose-500 transition-all duration-300 shadow-xs"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>

              {/* Card Meta & Quick Resume Play Action */}
              <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 space-y-1.5">
                <Link
                  to="/watch/$episodeId"
                  params={{ episodeId: item.episodeId }}
                  search={{ a: item.animeId, autoplay: true }}
                  className="block group/title"
                >
                  <h3
                    title={item.animeTitle}
                    className="line-clamp-1 font-display text-xs font-bold text-card-foreground group-hover/title:text-primary transition-colors"
                  >
                    {item.animeTitle}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                    <span className="truncate">{item.episodeTitle || "Lanjutkan Nonton"}</span>
                    <span className="shrink-0 font-semibold text-primary">{percent}%</span>
                  </div>
                </Link>

                {/* Quick Action Button */}
                <Link
                  to="/watch/$episodeId"
                  params={{ episodeId: item.episodeId }}
                  search={{ a: item.animeId, autoplay: true }}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary/80 py-1.5 text-[11px] font-bold text-foreground transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Lanjutkan</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
