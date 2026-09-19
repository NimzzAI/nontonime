import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { cn, formatViews } from "@/lib/utils";

export function AnimeCard({ anime }: { anime: AnimeSummary }) {
  const isOngoing = /ongoing|tayang/i.test(anime.status ?? "");
  const meta = [anime.type, anime.status].filter(Boolean).join(" · ");

  return (
    <Link
      to="/anime/$animeId"
      params={{ animeId: anime.id }}
      className="card-lift group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {anime.poster ? (
          <img
            src={anime.poster}
            alt={anime.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <i className="fa-solid fa-clapperboard text-2xl" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
        {isOngoing ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-highlight px-2 py-0.5 text-[10px] font-bold text-highlight-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-highlight-foreground" />
            ONGOING
          </span>
        ) : null}
        {anime.views ? (
          <span className="glass absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-foreground">
            <i className="fa-solid fa-eye text-[9px]" />
            {formatViews(anime.views)}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
          {anime.title}
        </h3>
        {meta ? <p className={cn("truncate text-xs font-medium text-muted-foreground")}>{meta}</p> : null}
      </div>
    </Link>
  );
}
