import { Link } from "@tanstack/react-router";
import type { AnimeCardData } from "@/lib/anime-types";

export function AnimeListRow({ anime }: { anime: AnimeCardData }) {
  const meta = anime.status ?? anime.latestReleaseDate ?? anime.releaseDay;

  return (
    <Link
      to="/anime/$animeId"
      params={{ animeId: anime.animeId }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
    >
      <img src={anime.poster} alt={anime.title} loading="lazy" className="h-20 w-14 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">{anime.title}</h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {anime.score ? (
            <span className="inline-flex items-center gap-1">
              <i className="fa-solid fa-star text-primary" />
              {anime.score}
            </span>
          ) : null}
          {meta ? <span>{meta}</span> : null}
        </div>
      </div>
      <i className="fa-solid fa-chevron-right shrink-0 text-xs text-muted-foreground" />
    </Link>
  );
}
