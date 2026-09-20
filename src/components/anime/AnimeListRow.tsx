import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";

export function AnimeListRow({ anime }: { anime: AnimeSummary }) {
  const isOngoing = /ongoing|tayang/i.test(anime.status ?? "");

  return (
    <Link
      to="/anime/$animeId"
      params={{ animeId: anime.id }}
      className="press-soft group flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3 transition-all hover:border-primary/50 hover:bg-accent hover:shadow-sm"
    >
      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
        {anime.poster ? (
          <img
            src={anime.poster}
            alt={anime.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <i className="fa-solid fa-clapperboard text-sm" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="line-clamp-1 text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
          {anime.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {anime.score ? (
            <span className="inline-flex items-center gap-1 font-bold text-amber-500">
              <i className="fa-solid fa-star text-[10px]" />
              {anime.score}
            </span>
          ) : null}

          {anime.status ? (
            <span
              className={
                isOngoing
                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                  : "font-semibold text-sky-600 dark:text-sky-400"
              }
            >
              {isOngoing ? "Ongoing" : "Tamat"}
            </span>
          ) : null}

          {anime.type ? <span>{anime.type}</span> : null}
          {anime.episodes ? <span>{anime.episodes} Eps</span> : null}
        </div>

        {anime.genres && anime.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-md bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <i className="fa-solid fa-chevron-right shrink-0 text-xs text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 mr-1" />
    </Link>
  );
}
