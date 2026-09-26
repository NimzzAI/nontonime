import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Film,
  Layers,
  LayoutGrid,
  List,
  ListOrdered,
  Play,
  Search,
  Star,
} from "lucide-react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { WatchlistButton } from "@/components/anime/WatchlistButton";
import { ShareButton } from "@/components/anime/ShareButton";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { animeDetailQuery } from "@/lib/queries";
import { readHistory, type HistoryItem } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anime/$animeId")({
  head: ({ params }) => {
    const name = params.animeId.replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} — Nontonime` },
        {
          name: "description",
          content: `Streaming dan unduh anime ${name} subtitle Indonesia. Sinopsis lengkap, jadwal, dan daftar episode.`,
        },
        { property: "og:title", content: `${name} — Nontonime` },
        {
          property: "og:description",
          content: `Streaming anime ${name} subtitle Indonesia.`,
        },
      ],
    };
  },
  component: AnimeDetailPage,
});

export function AnimeDetailPage() {
  const { animeId } = Route.useParams();
  const { data: anime, isPending, error, refetch } = useQuery(animeDetailQuery(animeId));

  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const history = readHistory();
    const found = history.find((h) => h.animeId === animeId);
    setHistoryItem(found ?? null);
  }, [animeId]);

  const episodes = useMemo(() => {
    return anime?.episodes ?? [];
  }, [anime?.episodes]);

  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => a.number - b.number);
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return sortedEpisodes;
    const q = episodeSearch.toLowerCase().trim();
    return sortedEpisodes.filter(
      (ep) => String(ep.number).includes(q) || ep.title.toLowerCase().includes(q),
    );
  }, [sortedEpisodes, episodeSearch]);

  const firstEpisode = sortedEpisodes[0] ?? null;
  const continueEpisode = historyItem
    ? episodes.find((ep) => ep.id === historyItem.episodeId)
    : undefined;

  const targetEpisode = continueEpisode ?? firstEpisode;
  const targetLabel = continueEpisode
    ? `Lanjutkan Episode ${continueEpisode.number}`
    : firstEpisode
      ? `Nonton Episode ${firstEpisode.number}`
      : "Nonton Sekarang";

  if (isPending) return <LoadingState label="Memuat informasi anime..." />;
  if (error || !anime) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState error={error || new Error("Anime tidak ditemukan")} onRetry={() => refetch()} />
      </div>
    );
  }

  const isOngoing = /ongoing|tayang/i.test(anime.status ?? "");

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:py-8">
      {/* Hero Backdrop Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl">
        {anime.poster ? (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={anime.poster}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover blur-2xl scale-125 opacity-25 dark:opacity-15"
            />
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {/* Poster Card */}
            <div className="relative shrink-0 w-44 sm:w-52 lg:w-60 overflow-hidden rounded-2xl border-2 border-white/10 shadow-2xl bg-muted mx-auto md:mx-0">
              {anime.poster ? (
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="h-full w-full object-cover aspect-[2/3]"
                />
              ) : (
                <div className="aspect-[2/3] flex items-center justify-center text-muted-foreground">
                  <Film className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                {isOngoing ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    ONGOING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    TAMAT
                  </span>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                {anime.japanese ? (
                  <p className="text-xs font-semibold text-primary tracking-wide uppercase">
                    {anime.japanese}
                  </p>
                ) : null}
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                  {anime.title}
                </h1>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {anime.score ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {anime.score}
                  </span>
                ) : null}

                {anime.totalEpisodes ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-card border border-border/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                    <Layers className="h-3 w-3 text-primary" />
                    {anime.totalEpisodes} Episode
                  </span>
                ) : null}

                {anime.studio ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-card border border-border/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                    <Building2 className="h-3 w-3 text-primary" />
                    {anime.studio}
                  </span>
                ) : null}

                {anime.duration ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-card border border-border/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {anime.duration}
                  </span>
                ) : null}

                {anime.type ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-card border border-border/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {anime.type}
                  </span>
                ) : null}
              </div>

              {/* Genre Pills */}
              {anime.genres && anime.genres.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {anime.genres.map((g) => (
                    <Link
                      key={g}
                      to="/genre/$genreId"
                      params={{ genreId: g.toLowerCase().replace(/\s+/g, "-") }}
                      className="press-soft inline-flex items-center rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {targetEpisode ? (
                  <Link
                    to="/watch/$episodeId"
                    params={{ episodeId: targetEpisode.id }}
                    search={{ a: anime.id }}
                    className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                  >
                    <i className="fa-solid fa-play text-xs" />
                    {targetLabel}
                  </Link>
                ) : null}

                <WatchlistButton
                  animeId={anime.id}
                  title={anime.title}
                  poster={anime.poster}
                  variant="outline"
                />

                {anime.batch ? (
                  <Link
                    to="/download/$batchId"
                    params={{ batchId: anime.batch.batchId }}
                    className="press-soft inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <i className="fa-solid fa-box-archive text-xs" />
                    Unduh Batch
                  </Link>
                ) : null}

                <ShareButton title={anime.title} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details / Synopsis + Episodes */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Synopsis & Metadata Info */}
        <div className="space-y-6 lg:col-span-8">
          {/* Synopsis */}
          {anime.synopsis ? (
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-xs">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                Sinopsis
              </h2>
              <p
                className={cn(
                  "text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
                  !synopsisOpen && "line-clamp-4",
                )}
              >
                {anime.synopsis}
              </p>
              <button
                onClick={() => setSynopsisOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                {synopsisOpen ? "Tutup ringkasan" : "Baca selengkapnya"}
                <i
                  className={cn(
                    "fa-solid text-[10px]",
                    synopsisOpen ? "fa-chevron-up" : "fa-chevron-down",
                  )}
                />
              </button>
            </div>
          ) : null}

          {/* Episode List Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-list-ol text-primary" />
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Daftar Episode
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  ({sortedEpisodes.length})
                </span>
              </div>

              {/* View toggle & Filter */}
              <div className="flex items-center gap-2">
                {sortedEpisodes.length > 6 ? (
                  <div className="relative w-40 sm:w-48">
                    <input
                      type="text"
                      placeholder="Cari eps..."
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      className="h-8 w-full rounded-lg border border-border/80 bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground" />
                  </div>
                ) : null}

                <div className="flex items-center rounded-lg border border-border/80 bg-background p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Tampilan grid"
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-xs transition",
                      viewMode === "grid"
                        ? "bg-card text-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <i className="fa-solid fa-grip" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="Tampilan list"
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-xs transition",
                      viewMode === "list"
                        ? "bg-card text-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <i className="fa-solid fa-bars" />
                  </button>
                </div>
              </div>
            </div>

            {/* Episodes Display */}
            {filteredEpisodes.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
                  {filteredEpisodes.map((ep) => {
                    const isLastWatched = historyItem?.episodeId === ep.id;
                    return (
                      <Link
                        key={ep.id}
                        to="/watch/$episodeId"
                        params={{ episodeId: ep.id }}
                        search={{ a: anime.id }}
                        className={cn(
                          "press-soft flex aspect-square flex-col items-center justify-center rounded-xl border text-xs font-bold transition-all hover:scale-105",
                          isLastWatched
                            ? "border-primary bg-primary/20 text-primary shadow-xs"
                            : "border-border/80 bg-background/70 text-card-foreground hover:border-primary/50 hover:bg-accent",
                        )}
                        title={ep.title}
                      >
                        <span>{ep.number}</span>
                        {isLastWatched ? (
                          <span className="text-[8px] font-semibold uppercase text-primary">
                            Nonton
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5 divide-y divide-border/40">
                  {filteredEpisodes.map((ep) => {
                    const isLastWatched = historyItem?.episodeId === ep.id;
                    return (
                      <Link
                        key={ep.id}
                        to="/watch/$episodeId"
                        params={{ episodeId: ep.id }}
                        search={{ a: anime.id }}
                        className={cn(
                          "press-soft flex items-center justify-between p-3 rounded-xl transition hover:bg-accent",
                          isLastWatched && "bg-primary/10",
                        )}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground shrink-0">
                            {ep.number}
                          </span>
                          <span className="truncate text-xs sm:text-sm font-semibold text-foreground">
                            {ep.title}
                          </span>
                        </div>
                        <i className="fa-solid fa-play text-xs text-primary shrink-0 ml-2" />
                      </Link>
                    );
                  })}
                </div>
              )
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Episode tidak ditemukan.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Batch & Recommendations */}
        <div className="space-y-6 lg:col-span-4">
          {/* Metadata Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-xs">
            <h3 className="font-display text-sm font-bold text-foreground border-b border-border/60 pb-2">
              Informasi Anime
            </h3>

            <dl className="space-y-2.5 text-xs">
              {anime.status ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-semibold text-foreground">{anime.status}</dd>
                </div>
              ) : null}

              {anime.aired ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tanggal Rilis</dt>
                  <dd className="font-semibold text-foreground">{anime.aired}</dd>
                </div>
              ) : null}

              {anime.studio ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Studio</dt>
                  <dd className="font-semibold text-foreground">{anime.studio}</dd>
                </div>
              ) : null}

              {anime.producers ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Produser</dt>
                  <dd className="font-semibold text-foreground text-right truncate max-w-[180px]">
                    {anime.producers}
                  </dd>
                </div>
              ) : null}

              {anime.totalEpisodes ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total Episode</dt>
                  <dd className="font-semibold text-foreground">{anime.totalEpisodes}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Batch Download Widget if Available */}
          {anime.batch ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <i className="fa-solid fa-box-archive" />
                <span>Download Batch Lengkap</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tersedia paket unduh seluruh episode dalam resolusi 360p, 480p, dan 720p HD.
              </p>
              <Link
                to="/download/$batchId"
                params={{ batchId: anime.batch.batchId }}
                className="block w-full text-center rounded-xl bg-emerald-600 text-white py-2 text-xs font-bold hover:bg-emerald-700 transition"
              >
                Buka Tautan Batch
              </Link>
            </div>
          ) : null}

          {/* Recommended Anime Widget */}
          {anime.recommended && anime.recommended.length > 0 ? (
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-xs">
              <h3 className="font-display text-sm font-bold text-foreground border-b border-border/60 pb-2">
                Rekomendasi Terkait
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {anime.recommended.slice(0, 4).map((rec) => (
                  <AnimeCard key={rec.id} anime={rec} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
