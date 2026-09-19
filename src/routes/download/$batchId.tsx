import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { ServerList } from "@/components/anime/ServerList";
import { animeDetailQuery, streamQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { EpisodeSummary } from "@/lib/anime-types";

export const Route = createFileRoute("/download/$batchId")({
  head: ({ params }) => {
    const name = params.batchId.replace(/-/g, " ");
    return {
      meta: [
        { title: `Unduh Semua Episode ${name} — Nontonime` },
        { name: "description", content: `Tautan unduhan per episode ${name} subtitle Indonesia per resolusi.` },
        { property: "og:title", content: `Unduh Semua Episode ${name} — Nontonime` },
        { property: "og:description", content: `Tautan unduhan per episode ${name} subtitle Indonesia.` },
      ],
    };
  },
  component: BatchPage,
});

function EpisodeDownloadRow({ episode, animeId }: { episode: EpisodeSummary; animeId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useQuery({ ...streamQuery(episode.id), enabled: open });

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {episode.image ? (
              <img src={episode.image} alt={episode.title} loading="lazy" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-card-foreground">Episode {episode.number}</p>
            {episode.releaseDate ? <p className="text-xs text-muted-foreground">{episode.releaseDate}</p> : null}
          </div>
        </div>
        <i className={cn("fa-solid fa-chevron-down shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-3 border-t border-border pt-3">
          {isPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <i className="fa-solid fa-circle-notch fa-spin" />
              Memuat pilihan unduhan
            </p>
          ) : isError ? (
            <p className="text-xs text-muted-foreground">Gagal memuat server. Coba lagi.</p>
          ) : (
            <ServerList servers={data?.servers ?? []} episodeId={episode.id} animeId={animeId} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function BatchPage() {
  const { batchId } = Route.useParams();
  const { data, isPending, error, refetch } = useQuery(animeDetailQuery(batchId));

  if (isPending) return <LoadingState label="Memuat daftar episode" />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );

  const anime = data;
  const episodes = [...anime.episodes].sort((a, b) => a.number - b.number);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-start gap-4">
        {anime.poster ? (
          <img src={anime.poster} alt={anime.title} className="w-28 rounded-2xl border border-border object-cover" />
        ) : null}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{anime.title}</h1>
          <p className="text-sm text-muted-foreground">
            {[anime.type, `${episodes.length} episode`].filter(Boolean).join(" · ")}
          </p>
          <Link
            to="/anime/$animeId"
            params={{ animeId: batchId }}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <i className="fa-solid fa-arrow-left" />
            Kembali ke detail anime
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {episodes.map((episode) => (
          <EpisodeDownloadRow key={episode.id} episode={episode} animeId={batchId} />
        ))}
      </div>
    </div>
  );
}
