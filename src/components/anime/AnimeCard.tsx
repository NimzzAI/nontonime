import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Film, Layers, Play, Star } from "lucide-react";
import { WatchlistButton } from "./WatchlistButton";

export function AnimeCard({
  anime,
  featured = false,
}: {
  anime: AnimeSummary;
  featured?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const isOngoing = /ongoing|tayang/i.test(anime.status ?? "") || Boolean(anime.releaseDay);
  const isCompleted = /tamat|complete/i.test(anime.status ?? "");

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
    <Link
      to="/anime/$animeId"
      params={{ animeId: anime.id }}
      className="card-lift group relative block overflow-hidden rounded-xl sm:rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-xl"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/60">
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
        <div className="absolute top-2 inset-x-2 flex items-start justify-between gap-1.5 z-10">
          {/* Status badge */}
          <div className="flex flex-col gap-1 items-start pointer-events-none">
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
          <div className="flex items-center gap-1">
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

        {/* Bottom episode pill */}
        {episodeLabel ? (
          <div className="absolute bottom-2 left-2 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-md">
              <Layers className="h-2.5 w-2.5 text-primary" />
              {episodeLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-1 p-2.5 sm:p-3">
        <h3
          className={cn(
            "line-clamp-2 font-display text-xs font-bold leading-snug text-card-foreground transition-colors group-hover:text-primary sm:text-sm",
            featured && "text-sm sm:text-base",
          )}
          title={anime.title}
        >
          {anime.title}
        </h3>
        {subtitle ? (
          <p className="truncate text-[11px] font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
