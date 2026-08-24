import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { EpisodeListItem } from "@/lib/anime-types";

export function EpisodeGrid({
  episodes,
  activeEpisodeId,
}: {
  episodes: EpisodeListItem[];
  activeEpisodeId?: string;
}) {
  if (episodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada episode tersedia.</p>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
      {[...episodes]
        .sort((a, b) => a.eps - b.eps)
        .map((episode) => {
          const isActive = episode.episodeId === activeEpisodeId;
          return (
            <Link
              key={episode.episodeId}
              to="/watch/$episodeId"
              params={{ episodeId: episode.episodeId }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-card-foreground hover:bg-accent",
              )}
            >
              {episode.eps}
            </Link>
          );
        })}
    </div>
  );
}
