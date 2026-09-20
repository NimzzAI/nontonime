import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { cn } from "@/lib/utils";

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

  const episodeLabel = anime.episodes ? `${anime.episodes} Eps` : isOngoing ? "Ongoing" : null;

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
      className="card-lift group relative block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-xl"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/60">
        {anime.poster && !imgError ? (
          <img
            src={anime.poster}
            alt={anime.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
            <i className="fa-solid fa-film text-2xl text-muted-foreground/50" />
            <span className="line-clamp-2 text-xs font-medium leading-tight">{anime.title}</span>
          </div>
        )}

        {/* Cinematic gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

        {/* Hover quick play icon */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-lg shadow-primary/40 backdrop-blur-xs">
            <i className="fa-solid fa-play ml-0.5 text-sm" />
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
          {isOngoing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              ONGOING
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
              <i className="fa-solid fa-circle-check text-[9px]" />
              TAMAT
            </span>
          ) : null}
        </div>

        {/* Score badge in top-right if present */}
        {anime.score ? (
          <div className="absolute right-2 top-2">
            <span className="glass inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-xs backdrop-blur-md">
              <i className="fa-solid fa-star text-[9px] text-amber-400" />
              {anime.score}
            </span>
          </div>
        ) : null}

        {/* Bottom episode pill */}
        {episodeLabel ? (
          <div className="absolute bottom-2 left-2">
            <span className="glass inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-md">
              <i className="fa-solid fa-layer-group text-[9px] text-primary" />
              {episodeLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-1 p-3">
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
