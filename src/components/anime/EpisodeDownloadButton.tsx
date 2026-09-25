import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { streamQuery } from "@/lib/queries";
import { ServerList } from "./ServerList";
import type { EpisodeSummary } from "@/lib/anime-types";
import { Download, Loader2 } from "lucide-react";

export function EpisodeDownloadButton({
  episode,
  animeId,
}: {
  episode: EpisodeSummary;
  animeId: string;
}) {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useQuery({ ...streamQuery(episode.id), enabled: open });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Unduh Episode ${episode.number}`}
          className="press-soft inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-popover-foreground">Episode {episode.number}</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("open-download-manager"));
            }}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            Download Manager
          </button>
        </div>
        {isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Memuat server &amp; kualitas
          </p>
        ) : isError ? (
          <p className="text-xs text-muted-foreground">Gagal memuat pilihan server. Coba lagi.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1">
            <ServerList servers={data?.servers ?? []} episodeId={episode.id} animeId={animeId} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
