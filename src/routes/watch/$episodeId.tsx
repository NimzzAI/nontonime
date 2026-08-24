import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { VideoPlayer } from "@/components/anime/VideoPlayer";
import { EpisodeGrid } from "@/components/anime/EpisodeGrid";
import { EpisodeDownloadButton } from "@/components/anime/EpisodeDownloadButton";
import { ShareButton } from "@/components/anime/ShareButton";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { animeDetailQuery, episodeQuery, streamQuery } from "@/lib/queries";
import { saveHistory } from "@/lib/history";
import { formatViews } from "@/lib/utils";

export const Route = createFileRoute("/watch/$episodeId")({
  head: ({ params }) => {
    const name = params.episodeId.replace(/-sub-indo$/, "").replace(/-/g, " ");
    return {
      meta: [
        { title: `Nonton ${name} — Nontonime` },
        { name: "description", content: `Streaming ${name} subtitle Indonesia dengan pilihan kualitas dan server.` },
        { property: "og:title", content: `Nonton ${name} — Nontonime` },
        { property: "og:description", content: `Streaming ${name} subtitle Indonesia.` },
      ],
    };
  },
  component: WatchPage,
});

function WatchPage() {
  const { episodeId } = Route.useParams();
  const episode = useQuery(episodeQuery(episodeId));
  const [quality, setQuality] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);

  const qualities = episode.data?.data.server?.qualities ?? [];

  useEffect(() => {
    setQuality(null);
    setServerId(null);
  }, [episodeId]);

  useEffect(() => {
    if (quality || qualities.length === 0) return;
    const preferred = qualities.find((item) => item.serverList.length > 0) ?? qualities[0];
    if (!preferred) return;
    setQuality(preferred.title);
    setServerId(preferred.serverList[0]?.serverId ?? null);
  }, [qualities, quality]);

  const activeServers = useMemo(
    () => qualities.find((item) => item.title === quality)?.serverList ?? [],
    [qualities, quality],
  );

  const stream = useQuery(streamQuery(serverId));
  const animeId = episode.data?.data.animeId ?? "";
  const anime = useQuery({ ...animeDetailQuery(animeId), enabled: Boolean(animeId) });

  useEffect(() => {
    if (!episode.data || !anime.data) return;
    saveHistory({
      episodeId,
      animeId: episode.data.data.animeId,
      animeTitle: anime.data.data.title,
      episodeTitle: episode.data.data.title,
      poster: anime.data.data.poster,
      watchedAt: Date.now(),
    });
  }, [episode.data, anime.data, episodeId]);

  if (episode.isPending) return <LoadingState label="Memuat episode" />;
  if (episode.error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={episode.error} onRetry={() => episode.refetch()} />
      </div>
    );

  const data = episode.data.data;
  const episodes = anime.data?.data.episodeList ?? [];
  const activeEpisode = episodes.find((ep) => ep.episodeId === episodeId);
  const batchId = anime.data?.data.batch?.batchId ?? null;
  const firstParagraph = anime.data?.data.synopsis.paragraphs[0];
  const activeEpisodeViews = activeEpisode?.views;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {stream.error ? (
        <ErrorState error={stream.error} onRetry={() => stream.refetch()} />
      ) : (
        <VideoPlayer src={stream.data?.data.url ?? null} />
      )}

      <div className="space-y-1">
        <h1 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {anime.data?.data.title ?? data.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {activeEpisode ? <span>Episode {activeEpisode.eps}</span> : null}
          {activeEpisodeViews ? (
            <span className="inline-flex items-center gap-1">
              <i className="fa-solid fa-eye" />
              {formatViews(activeEpisodeViews)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kualitas</p>
          <div className="flex flex-wrap gap-2">
            {qualities.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  setQuality(item.title);
                  setServerId(item.serverList[0]?.serverId ?? null);
                }}
                className={
                  item.title === quality
                    ? "rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                    : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
                }
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Server</p>
          <div className="flex flex-wrap gap-2">
            {activeServers.map((server) => (
              <button
                key={server.serverId}
                onClick={() => setServerId(server.serverId)}
                className={
                  server.serverId === serverId
                    ? "rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground"
                    : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
                }
              >
                {server.title.trim()}
              </button>
            ))}
            {activeServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Server tidak tersedia untuk kualitas ini.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ShareButton title={anime.data?.data.title ?? data.title} text="Nonton anime ini di Nontonime" />
        {activeEpisode ? <EpisodeDownloadButton episode={activeEpisode} batchId={batchId} /> : null}
        <div className="ml-auto flex items-center gap-2">
          {data.hasPrevEpisode && data.prevEpisode ? (
            <Link
              to="/watch/$episodeId"
              params={{ episodeId: data.prevEpisode.episodeId }}
              aria-label="Episode sebelumnya"
              className="press-soft inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <i className="fa-solid fa-backward-step" />
            </Link>
          ) : null}
          {data.hasNextEpisode && data.nextEpisode ? (
            <Link
              to="/watch/$episodeId"
              params={{ episodeId: data.nextEpisode.episodeId }}
              aria-label="Episode selanjutnya"
              className="press-soft inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <i className="fa-solid fa-forward-step" />
            </Link>
          ) : null}
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold tracking-tight text-foreground">Episode List</h2>
          {animeId ? (
            <Link to="/anime/$animeId" params={{ animeId }} className="text-xs font-medium text-primary hover:underline">
              Lihat detail
            </Link>
          ) : null}
        </div>
        {anime.isPending ? (
          <p className="text-sm text-muted-foreground">Memuat daftar episode…</p>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1">
            <EpisodeGrid episodes={episodes} activeEpisodeId={episodeId} />
          </div>
        )}
      </section>

      {anime.data ? (
        <section className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <img
            src={anime.data.data.poster}
            alt={anime.data.data.title}
            className="h-28 w-20 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 space-y-1">
            <Link
              to="/anime/$animeId"
              params={{ animeId }}
              className="line-clamp-2 text-sm font-semibold text-card-foreground hover:text-primary"
            >
              {anime.data.data.title}
            </Link>
            {firstParagraph ? (
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{firstParagraph}</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
