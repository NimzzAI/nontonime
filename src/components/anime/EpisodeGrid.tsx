import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { EpisodeSummary } from "@/lib/anime-types";

export function EpisodeGrid({
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
      {[...episodes]
        .sort((a, b) => a.number - b.number)
        .map((episode) => {
          const isActive = episode.id === activeEpisodeId;
          return (
            <Link
              key={episode.id}
              to="/watch/$episodeId"
              params={{ episodeId: episode.id }}
              search={{ a: animeId }}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-card-foreground hover:bg-accent",
              )}
            >
              {episode.isNew ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-highlight" />
              ) : null}
              {episode.number}
            </Link>
          );
        })}
    </div>
  );
}
