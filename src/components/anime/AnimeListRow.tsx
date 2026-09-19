import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { formatViews } from "@/lib/utils";

export function AnimeListRow({ anime }: { anime: AnimeSummary }) {
  const meta = [anime.type, anime.status, anime.year].filter(Boolean).join(" · ");

  return (
    <Link
      to="/anime/$animeId"
      params={{ animeId: anime.id }}
      className="press-soft flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent"
    >
      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {anime.poster ? (
          <img src={anime.poster} alt={anime.title} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
          {anime.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {meta ? <span className="line-clamp-1">{meta}</span> : null}
          {anime.views ? (
            <span className="inline-flex shrink-0 items-center gap-1">
              <i className="fa-solid fa-eye text-primary" />
              {formatViews(anime.views)}
            </span>
          ) : null}
        </div>
        {anime.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {anime.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <i className="fa-solid fa-chevron-right shrink-0 text-xs text-muted-foreground" />
    </Link>
  );
}
