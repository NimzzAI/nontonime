import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Film, Layers, Play, Star, Info, Check } from "lucide-react";
import { WatchlistButton } from "./WatchlistButton";
import { AnimeQuickPreviewModal } from "./AnimeQuickPreviewModal";
import { readHistory, type HistoryItem } from "@/lib/history";

export function AnimeCard({
  anime,
  featured = false,
}: {
  anime: AnimeSummary;
  featured?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);

  const isOngoing = /ongoing|tayang/i.test(anime.status ?? "") || Boolean(anime.releaseDay);
  const isCompleted = /tamat|complete/i.test(anime.status ?? "");

  useEffect(() => {
    const list = readHistory();
    const found = list.find((h) => h.animeId === anime.id);
    setHistoryItem(found ?? null);
  }, [anime.id]);

  const episodeLabel = anime.episodeCount
    ? `${anime.episodeCount} Eps`
    : isOngoing
      ? "Ongoing"
      : null;

  const subtitle = [
    anime.type || "TV",
    anime.releaseDay || anime.day || anime.latestReleaseDate || (isCompleted ? "Tamat" : null),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-xl isolate">
        {/* Main Clickable Poster & Link */}
        <Link
          to="/anime/$animeId"
          params={{ animeId: anime.id }}
          className="relative aspect-[2/3] w-full overflow-hidden bg-muted/60 block"
        >
          {anime.poster && !imgError ? (
            <img
              src={anime.poster}
              alt={anime.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
              <Film className="h-6 w-6 text-muted-foreground/40" />
              <span className="line-clamp-2 text-xs font-medium leading-tight">{anime.title}</span>
            </div>
          )}

          {/* Cinematic gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

          {/* Hover quick play icon */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-lg shadow-primary/40 backdrop-blur-xs">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
          </div>

          {/* Top Badges and Action Row */}
          <div className="absolute top-2 inset-x-2 flex items-start justify-between gap-1.5 z-10 pointer-events-none">
            {/* Status badge */}
            <div className="flex flex-col gap-1 items-start">
              {isOngoing ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  ONGOING
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  TAMAT
                </span>
              ) : null}
            </div>

            {/* Right: Score + Spring Watchlist Toggle Button */}
            <div className="flex items-center gap-1 pointer-events-auto">
              {anime.score ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-xs backdrop-blur-md pointer-events-none">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  {anime.score}
                </span>
              ) : null}

              <WatchlistButton
                animeId={anime.id}
                title={anime.title}
                poster={anime.poster}
                variant="card-overlay"
                size="sm"
              />
            </div>
          </div>

          {/* Bottom episode pill & Watched Progress indicator */}
          <div className="absolute bottom-2 inset-x-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            {episodeLabel ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-md">
                <Layers className="h-2.5 w-2.5 text-primary" />
                {episodeLabel}
              </span>
            ) : (
              <span />
            )}

            {/* If watched in history, show badge */}
            {historyItem ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground backdrop-blur-md shadow-xs">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
                Ditonton
              </span>
            ) : null}
          </div>

          {/* Red Progress Bar at bottom edge if watched */}
          {historyItem ? (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-muted/40">
              <div className="h-full w-full bg-primary" />
            </div>
          ) : null}
        </Link>

        {/* Card Info & Quick Preview Action */}
        <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3 bg-card">
          <div className="space-y-1">
            <Link to="/anime/$animeId" params={{ animeId: anime.id }} className="block group/title">
              <h3
                className={cn(
                  "line-clamp-2 font-display text-xs font-bold leading-snug text-card-foreground transition-colors group-hover/title:text-primary sm:text-sm min-h-[2.25rem] sm:min-h-[2.5rem]",
                  featured && "text-sm sm:text-base min-h-[2.5rem]",
                )}
                title={anime.title}
              >
                {anime.title}
              </h3>
            </Link>

            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {subtitle || "Anime Sub Indo"}
            </p>
          </div>

          {/* Bottom quick preview trigger row */}
          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPreviewOpen(true);
              }}
              title="Pratinjau Cepat Anime"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Info className="h-3 w-3" />
              <span>Pratinjau</span>
            </button>

            <Link
              to="/anime/$animeId"
              params={{ animeId: anime.id }}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Detail →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Preview Modal */}
      <AnimeQuickPreviewModal anime={anime} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
