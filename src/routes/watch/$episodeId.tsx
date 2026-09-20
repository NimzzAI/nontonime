import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { VideoPlayer } from "@/components/anime/VideoPlayer";
import { EpisodeGrid } from "@/components/anime/EpisodeGrid";
import { EpisodeDownloadButton } from "@/components/anime/EpisodeDownloadButton";
import { ShareButton } from "@/components/anime/ShareButton";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { animeDetailQuery, streamQuery } from "@/lib/queries";
import { saveHistory } from "@/lib/history";
import { formatViews } from "@/lib/utils";
import type { EpisodeSummary } from "@/lib/anime-types";

export const Route = createFileRoute("/watch/$episodeId")({
  validateSearch: (search: Record<string, unknown>) => ({
    a: search["a"] ? String(search["a"]) : undefined,
  }),
  head: ({ params }) => {
    const name = params.episodeId.replace(/-/g, " ");
    return {
      meta: [
        { title: `Nonton Episode ${name} — Nontonime` },
        {
          name: "description",
          content: "Streaming anime subtitle Indonesia dengan pilihan kualitas dan server.",
        },
        { property: "og:title", content: `Nonton Episode ${name} — Nontonime` },
        { property: "og:description", content: "Streaming anime subtitle Indonesia." },
      ],
    };
  },
  component: WatchPage,
});

function WatchPage() {
  const { episodeId } = Route.useParams();
  const { a: animeId } = Route.useSearch();
  const [isTheater, setIsTheater] = useState(false);
  const stream = useQuery(streamQuery(episodeId));
  const anime = useQuery({ ...animeDetailQuery(animeId ?? ""), enabled: Boolean(animeId) });

  const [quality, setQuality] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);

  const servers = stream.data?.servers ?? [];
  const qualities = useMemo(() => [...new Set(servers.map((s) => s.quality))], [servers]);

  useEffect(() => {
    setQuality(null);
    setServerId(null);
  }, [episodeId]);

  useEffect(() => {
    if (quality || servers.length === 0) return;
    setQuality(servers[0]!.quality);
    setServerId(servers[0]!.id);
  }, [servers, quality]);

  const activeServers = servers.filter((server) => server.quality === quality);
  const activeServer = servers.find((server) => server.id === serverId) ?? null;

  const episodes = anime.data?.episodes ?? [];
  const sortedEpisodes = useMemo(
    () => [...episodes].sort((a, b) => a.number - b.number),
    [episodes],
  );
  const activeIndex = sortedEpisodes.findIndex((episode) => episode.id === episodeId);
  const activeEpisode: EpisodeSummary | undefined = sortedEpisodes[activeIndex];
  const prevEpisode = activeIndex > 0 ? sortedEpisodes[activeIndex - 1] : undefined;
  const nextEpisode =
    activeIndex >= 0 && activeIndex < sortedEpisodes.length - 1
      ? sortedEpisodes[activeIndex + 1]
      : undefined;
  const nextEpisodeId = nextEpisode?.id ?? stream.data?.episode.nextEpisodeId ?? null;

  useEffect(() => {
    if (!stream.data || !anime.data || !animeId) return;
    saveHistory({
      episodeId,
      animeId,
      animeTitle: anime.data.title,
      episodeTitle:
        activeEpisode?.title ||
        stream.data.episode.title ||
        `Episode ${stream.data.episode.number}`,
      poster: anime.data.poster ?? "",
      watchedAt: Date.now(),
    });
  }, [stream.data, anime.data, animeId, episodeId, activeEpisode]);

  if (stream.isPending) return <LoadingState label="Memuat episode" />;
  if (stream.error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={stream.error} onRetry={() => stream.refetch()} />
      </div>
    );

  const episodeMeta = stream.data.episode;
  const displayTitle = anime.data?.title ?? episodeMeta.title ?? `Episode ${episodeMeta.number}`;
  const episodeForDownload: EpisodeSummary = activeEpisode ?? {
    id: episodeId,
    number: episodeMeta.number,
    title: episodeMeta.title,
    views: episodeMeta.views,
    releaseDate: episodeMeta.releaseDate,
    image: null,
    isNew: false,
  };

  return (
    <div
      className={cn(
        "mx-auto space-y-6 px-4 py-6 transition-all duration-300 sm:py-8",
        isTheater ? "max-w-7xl" : "max-w-4xl",
      )}
    >
      <VideoPlayer
        src={activeServer?.url ?? null}
        isTheater={isTheater}
        onToggleTheater={() => setIsTheater((v) => !v)}
      />

      <div className="space-y-1">
        <h1 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {displayTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Episode {episodeMeta.number}</span>
          {episodeMeta.views ? (
            <span className="inline-flex items-center gap-1">
              <i className="fa-solid fa-eye" />
              {formatViews(episodeMeta.views)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kualitas
          </p>
          <div className="flex flex-wrap gap-2">
            {qualities.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuality(item);
                  const first = servers.find((server) => server.quality === item);
                  setServerId(first?.id ?? null);
                }}
                className={
                  item === quality
                    ? "rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                    : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
                }
              >
                {item || "Default"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Server
          </p>
          <div className="flex flex-wrap gap-2">
            {activeServers.map((server) => (
              <button
                key={server.id}
                onClick={() => setServerId(server.id)}
                className={
                  server.id === serverId
                    ? "rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground"
                    : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
                }
              >
                {server.name.trim()}
              </button>
            ))}
            {activeServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Server tidak tersedia untuk kualitas ini.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ShareButton title={displayTitle} text="Nonton anime ini di Nontonime" />
        {animeId ? <EpisodeDownloadButton episode={episodeForDownload} animeId={animeId} /> : null}
        <div className="ml-auto flex items-center gap-2">
          {prevEpisode ? (
            <Link
              to="/watch/$episodeId"
              params={{ episodeId: prevEpisode.id }}
              search={{ a: animeId }}
              aria-label="Episode sebelumnya"
              className="press-soft inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <i className="fa-solid fa-backward-step" />
            </Link>
          ) : null}
          {nextEpisodeId ? (
            <Link
              to="/watch/$episodeId"
              params={{ episodeId: nextEpisodeId }}
              search={{ a: animeId }}
              aria-label="Episode selanjutnya"
              className="press-soft inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <i className="fa-solid fa-forward-step" />
            </Link>
          ) : null}
        </div>
      </div>

      {animeId ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">
              Episode List
            </h2>
            <Link
              to="/anime/$animeId"
              params={{ animeId }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Lihat detail
            </Link>
          </div>
          {anime.isPending ? (
            <p className="text-sm text-muted-foreground">Memuat daftar episode…</p>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1">
              <EpisodeGrid
                episodes={sortedEpisodes}
                animeId={animeId}
                activeEpisodeId={episodeId}
              />
            </div>
          )}
        </section>
      ) : null}

      {anime.data ? (
        <section className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <img
            src={anime.data.poster ?? ""}
            alt={anime.data.title}
            className="h-28 w-20 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 space-y-1">
            <Link
              to="/anime/$animeId"
              params={{ animeId: animeId ?? "" }}
              className="line-clamp-2 text-sm font-semibold text-card-foreground hover:text-primary"
            >
              {anime.data.title}
            </Link>
            {anime.data.synopsis ? (
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {anime.data.synopsis}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
