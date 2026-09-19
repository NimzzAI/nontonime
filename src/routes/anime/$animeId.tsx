import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { EpisodeList } from "@/components/anime/EpisodeList";
import { WatchlistButton } from "@/components/anime/WatchlistButton";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { animeDetailQuery, genreAnimeQuery, genreListQuery } from "@/lib/queries";
import { readHistory, type HistoryItem } from "@/lib/history";
import { isSubscribed, addSubscription, removeSubscription } from "@/lib/subscriptions";
import { requestNotificationPermission, showLocalNotification, subscribeToPush } from "@/lib/push";
import { cn, formatViews } from "@/lib/utils";

export const Route = createFileRoute("/anime/$animeId")({
  head: ({ params }) => {
    const name = params.animeId.replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} — Nontonime` },
        { name: "description", content: `Sinopsis, informasi, dan daftar episode ${name} subtitle Indonesia.` },
        { property: "og:title", content: `${name} — Nontonime` },
        { property: "og:description", content: `Sinopsis dan daftar episode ${name} subtitle Indonesia.` },
      ],
    };
  },
  component: AnimeDetailPage,
});

function Pill({ icon, text }: { icon?: string; text: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground">
      {icon ? <i className={`${icon} text-primary`} /> : null}
      {text}
    </span>
  );
}

function Synopsis({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-semibold text-foreground">Sinopsis</h2>
      <p className={cn("text-sm leading-relaxed text-muted-foreground", !expanded && "line-clamp-4")}>
        {text}
      </p>
      <button
        onClick={() => setExpanded((value) => !value)}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {expanded ? "Sembunyikan" : "Selengkapnya"}
        <i className={cn("fa-solid text-xs", expanded ? "fa-chevron-up" : "fa-chevron-down")} />
      </button>
    </section>
  );
}

function SubscribeButton({ animeId, animeTitle }: { animeId: string; animeTitle: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSubscribed(isSubscribed(animeId));
  }, [animeId]);

  async function handleClick() {
    if (subscribed) {
      removeSubscription(animeId);
      setSubscribed(false);
      return;
    }

    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        await subscribeToPush();
        await showLocalNotification("Berlangganan aktif", {
          body: `Kamu bakal dapat notifikasi untuk ${animeTitle}.`,
        });
      }
      addSubscription(animeId, animeTitle);
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "press-soft inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 sm:w-auto",
        subscribed ? "bg-secondary text-secondary-foreground" : "bg-card text-card-foreground hover:bg-accent",
      )}
    >
      <i className={subscribed ? "fa-solid fa-bell" : "fa-regular fa-bell"} />
      {subscribed ? "Berlangganan" : "Subscribe"}
    </button>
  );
}

function AnimeDetailPage() {
  const { animeId } = Route.useParams();
  const { data, isPending, error, refetch } = useQuery(animeDetailQuery(animeId));
  const [continueItem, setContinueItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    setContinueItem(readHistory().find((item) => item.animeId === animeId) ?? null);
  }, [animeId]);

  const primaryGenre = data?.genres[0] ?? null;
  const genreList = useQuery({ ...genreListQuery(), enabled: Boolean(primaryGenre) });
  const matchedGenre = genreList.data?.find(
    (genre) => genre.name.toLowerCase() === (primaryGenre ?? "").toLowerCase(),
  );
  const recommended = useQuery({
    ...genreAnimeQuery(matchedGenre?.id ?? "", 1),
    enabled: Boolean(matchedGenre),
  });

  if (isPending) return <LoadingState label="Memuat detail anime" />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );

  const anime = data;
  const episodes = anime.episodes ?? [];
  const firstEpisode = episodes.length
    ? episodes.reduce((earliest, episode) => (episode.number < earliest.number ? episode : earliest), episodes[0]!)
    : null;
  const continueEpisode = continueItem
    ? episodes.find((episode) => episode.id === continueItem.episodeId)
    : undefined;
  const primaryTarget = continueEpisode ?? firstEpisode;
  const primaryLabel = continueEpisode
    ? `Lanjut Eps ${continueEpisode.number}`
    : firstEpisode
      ? `Tonton Episode ${firstEpisode.number}`
      : null;
  const isCompleted = /tamat|complete/i.test(anime.status ?? "");
  const recommendedItems = (recommended.data?.items ?? []).filter((item) => item.id !== animeId);

  return (
    <div className="mx-auto max-w-7xl space-y-10 overflow-x-hidden px-4 pb-8">
      <div className="relative -mx-4 sm:mx-0 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-border">
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          {anime.cover || anime.poster ? (
            <img src={anime.cover ?? anime.poster ?? ""} alt={anime.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          {anime.status ? (
            <span className="glass absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
              <i className={cn("fa-solid text-primary", isCompleted ? "fa-circle-check" : "fa-tower-broadcast")} />
              {anime.status}
            </span>
          ) : null}
        </div>
        <div className="relative -mt-14 space-y-1 px-4 sm:-mt-16">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground drop-shadow-sm sm:text-4xl">
            {anime.title}
          </h1>
          {anime.synonyms ? <p className="text-sm text-muted-foreground">{anime.synonyms}</p> : null}
        </div>
      </div>

      <div className="space-y-6">
        <div className="edge-fade no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {anime.type ? <Pill text={anime.type} /> : null}
          {anime.studio && anime.studio !== "-" ? <Pill text={anime.studio} /> : null}
          {anime.airedStart ? <Pill text={anime.airedStart} /> : null}
          {anime.totalEpisodes ? <Pill text={`${anime.totalEpisodes} episode`} /> : null}
          {anime.day ? <Pill icon="fa-solid fa-calendar-day" text={anime.day} /> : null}
          {anime.views ? <Pill icon="fa-solid fa-eye" text={`${formatViews(anime.views)} views`} /> : null}
        </div>

        {anime.genres.length ? (
          <div className="flex flex-wrap gap-2">
            {anime.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {primaryTarget && primaryLabel ? (
            <Link
              to="/watch/$episodeId"
              params={{ episodeId: primaryTarget.id }}
              search={{ a: animeId }}
              className="press-soft inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
            >
              <i className="fa-solid fa-play" />
              {primaryLabel}
            </Link>
          ) : null}
          <SubscribeButton animeId={animeId} animeTitle={anime.title} />
          <WatchlistButton animeId={animeId} title={anime.title} poster={anime.poster} />
        </div>

        {episodes.length > 0 ? (
          <Link
            to="/download/$batchId"
            params={{ batchId: animeId }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-80"
          >
            <i className="fa-solid fa-box-archive" />
            Unduh Semua Episode
          </Link>
        ) : null}

        <Synopsis text={anime.synopsis} />

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">Daftar Episode</h2>
          <EpisodeList episodes={episodes} animeId={animeId} />
        </section>

        {recommendedItems.length ? (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Rekomendasi</h2>
            <AnimeGrid items={recommendedItems.slice(0, 12)} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
