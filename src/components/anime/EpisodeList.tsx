import { Link } from "@tanstack/react-router";
import { cn, formatViews } from "@/lib/utils";
import type { EpisodeSummary } from "@/lib/anime-types";
import { EpisodeDownloadButton } from "./EpisodeDownloadButton";

export function EpisodeList({
  episodes,
  animeId,
  activeEpisodeId,
}: {
  episodes: EpisodeSummary[];
  animeId: string;
  activeEpisodeId?: string;
}) {
  if (episodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada episode tersedia.</p>;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {[...episodes]
        .sort((a, b) => b.number - a.number)
        .map((episode) => {
          const isActive = episode.id === activeEpisodeId;
          return (
            <li
              key={episode.id}
              className={cn("flex items-center gap-3 p-3", isActive && "bg-accent/60")}
            >
              <Link
                to="/watch/$episodeId"
                params={{ episodeId: episode.id }}
                search={{ a: animeId }}
                className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                {episode.image ? (
                  <img
                    src={episode.image}
                    alt={episode.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <i className="fa-solid fa-play text-sm" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
                  <i className="fa-solid fa-play text-xs text-white opacity-0 transition-opacity hover:opacity-100" />
                </div>
                {episode.isNew ? (
                  <span className="absolute left-1 top-1 rounded bg-highlight px-1.5 py-0.5 text-[9px] font-bold text-highlight-foreground">
                    BARU
                  </span>
                ) : null}
              </Link>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  Episode {episode.number}
                  {episode.title && episode.title !== `Episode ${episode.number}`
                    ? ` — ${episode.title}`
                    : ""}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {episode.views ? (
                    <span className="inline-flex items-center gap-1">
                      <i className="fa-solid fa-eye" />
                      {formatViews(episode.views)}
                    </span>
                  ) : null}
                  {episode.releaseDate ? <span>{episode.releaseDate}</span> : null}
                </div>
              </div>

              <EpisodeDownloadButton episode={episode} animeId={animeId} />
            </li>
          );
        })}
    </ul>
  );
}
