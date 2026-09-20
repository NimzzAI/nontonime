import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { cn, formatViews } from "@/lib/utils";

export function AnimeCard({ anime }: { anime: AnimeSummary }) {
  const [imgError, setImgError] = useState(false);
  const isOngoing = /ongoing|tayang/i.test(anime.status ?? "");
  const isCompleted = /tamat|complete/i.test(anime.status ?? "");
  const meta = [anime.type || "TV", anime.day || anime.year || (isCompleted ? "Tamat" : "Sub Indo")]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to="/anime/$animeId"
      params={{ animeId: anime.id }}
      className="card-lift group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted/60">
        {anime.poster && !imgError ? (
          <img
            src={anime.poster}
            alt={anime.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center text-muted-foreground">
            <i className="fa-solid fa-film text-2xl text-muted-foreground/60" />
            <span className="line-clamp-2 text-[10px] font-medium leading-tight">
              {anime.title}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

        {isOngoing ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            ONGOING
          </span>
        ) : isCompleted ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
            <i className="fa-solid fa-circle-check text-[9px]" />
            TAMAT
          </span>
        ) : null}

        {anime.views ? (
          <span className="glass absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
            <i className="fa-solid fa-eye text-[9px] text-primary" />
            {formatViews(anime.views)}
          </span>
        ) : null}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary sm:text-sm">
          {anime.title}
        </h3>
        {meta ? (
          <p className={cn("truncate text-[11px] font-medium text-muted-foreground sm:text-xs")}>
            {meta}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
