import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer } from "@/components/anime/VideoPlayer";
import { ShareButton } from "@/components/anime/ShareButton";
import { WatchEnhancements } from "@/components/anime/WatchEnhancements";
import { ErrorState, LoadingState } from "@/components/anime/StateViews";
import { animeDetailQuery, streamQuery } from "@/lib/queries";
import { fetchResolveServer } from "@/lib/anime.functions";
import { saveHistory } from "@/lib/history";
import { addExp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/watch/$episodeId")({
  validateSearch: (search: Record<string, unknown>) => ({
    a: search["a"] ? String(search["a"]) : undefined,
    autoplay:
      search["autoplay"] === "1" || search["autoplay"] === "true" || search["autoplay"] === true,
  }),
  head: ({ params }) => {
    const name = params.episodeId.replace(/-/g, " ");
    return {
      meta: [
        { title: `Nonton ${name} — Nontonime` },
        {
          name: "description",
          content: "Streaming anime subtitle Indonesia dengan pilihan resolusi dan server cepat.",
        },
        { property: "og:title", content: `Nonton ${name} — Nontonime` },
        { property: "og:description", content: "Streaming anime subtitle Indonesia." },
      ],
    };
  },
  component: WatchPage,
});

function WatchPage() {
  const { episodeId } = Route.useParams();
  const { a: searchAnimeId, autoplay: searchAutoplay } = Route.useSearch();
  const navigate = useNavigate();
  const [isTheater, setIsTheater] = useState(false);
  const [isAmbient, setIsAmbient] = useState(false);
  const [isSleepTriggered, setIsSleepTriggered] = useState(false);
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("nonton-auto-next") !== "false";
  });
  const [isAutoPlayActive, setIsAutoPlayActive] = useState<boolean>(() => Boolean(searchAutoplay));

  const stream = useQuery(streamQuery(episodeId));

  const resolvedAnimeId = searchAnimeId || stream.data?.animeId || "";
  const anime = useQuery({
    ...animeDetailQuery(resolvedAnimeId),
    enabled: Boolean(resolvedAnimeId),
  });

  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [episodeFilter, setEpisodeFilter] = useState("");

  // Sync stream default URL on episode load
  useEffect(() => {
    if (stream.data?.defaultStreamingUrl) {
      setCurrentStreamUrl(stream.data.defaultStreamingUrl);
    }
    setSelectedServerId(null);
    setSelectedQuality(null);
    if (searchAutoplay) {
      setIsAutoPlayActive(true);
    }
  }, [episodeId, stream.data?.defaultStreamingUrl, searchAutoplay]);

  // Server qualities
  const qualityGroups = useMemo(() => {
    return stream.data?.servers?.qualities ?? [];
  }, [stream.data?.servers?.qualities]);

  // Set default quality
  useEffect(() => {
    if (!selectedQuality && qualityGroups.length > 0) {
      // Prefer 720p or highest available
      const preferred =
        qualityGroups.find((q) => q.quality.includes("720")) ??
        qualityGroups.find((q) => q.quality.includes("480")) ??
        qualityGroups[0];
      if (preferred) {
        setSelectedQuality(preferred.quality);
      }
    }
  }, [qualityGroups, selectedQuality]);

  const activeGroup = useMemo(() => {
    return qualityGroups.find((q) => q.quality === selectedQuality) ?? qualityGroups[0];
  }, [qualityGroups, selectedQuality]);

  // Handle server switch
  const handleServerSelect = async (serverId: string) => {
    if (serverId === selectedServerId || isResolving) return;
    setSelectedServerId(serverId);
    setIsResolving(true);
    try {
      const res = await fetchResolveServer({ data: { serverId } });
      if (res.url) {
        setCurrentStreamUrl(res.url);
      }
    } catch (err) {
      console.error("Gagal mengganti server:", err);
    } finally {
      setIsResolving(false);
    }
  };

  // Episodes list from either anime detail query or stream info with accurate numbering
  const episodeList = useMemo(() => {
    const rawList =
      anime.data?.episodes && anime.data.episodes.length > 0
        ? anime.data.episodes
        : stream.data?.info?.episodeList && stream.data.info.episodeList.length > 0
          ? stream.data.info.episodeList.map((ep) => ({
              id: ep.episodeId,
              number: ep.eps,
              title: ep.title,
            }))
          : [];

    return rawList.map((ep) => {
      let num = ep.number;
      if (!num || num <= 0) {
        const match =
          ep.title?.match(/(?:episode|eps)[\s-]*(\d+)/i) ||
          ep.id?.match(/(?:episode|eps)[\s-]*(\d+)/i);
        if (match?.[1]) {
          num = parseInt(match[1], 10);
        }
      }
      return {
        ...ep,
        number: num || 0,
      };
    });
  }, [anime.data?.episodes, stream.data?.info?.episodeList]);

  const sortedEpisodes = useMemo(() => {
    return [...episodeList].sort((a, b) => a.number - b.number);
  }, [episodeList]);

  const filteredEpisodes = useMemo(() => {
    if (!episodeFilter.trim()) return sortedEpisodes;
    const q = episodeFilter.toLowerCase().trim();
    return sortedEpisodes.filter(
      (ep) => String(ep.number).includes(q) || ep.title.toLowerCase().includes(q),
    );
  }, [sortedEpisodes, episodeFilter]);

  const activeIndex = sortedEpisodes.findIndex((ep) => ep.id === episodeId);
  const prevEp = activeIndex > 0 ? sortedEpisodes[activeIndex - 1] : undefined;
  const nextEp =
    activeIndex >= 0 && activeIndex < sortedEpisodes.length - 1
      ? sortedEpisodes[activeIndex + 1]
      : undefined;

  const prevEpisodeId = prevEp?.id ?? stream.data?.prevEpisodeId ?? null;
  const nextEpisodeId = nextEp?.id ?? stream.data?.nextEpisodeId ?? null;

  // Derive next episode metadata from current series state
  const nextEpisodeMetadata = useMemo(() => {
    if (nextEp) {
      return {
        id: nextEp.id,
        number: nextEp.number,
        title: nextEp.title,
      };
    }
    if (stream.data?.nextEpisodeId) {
      const match = stream.data.info?.episodeList?.find(
        (e) => e.episodeId === stream.data?.nextEpisodeId,
      );
      return {
        id: stream.data.nextEpisodeId,
        number: match?.eps || (activeIndex >= 0 ? activeIndex + 2 : 2),
        title: match?.title || `Episode Berikutnya`,
      };
    }
    return null;
  }, [nextEp, stream.data, activeIndex]);

  // Silent auto-transition next episode handler without full page reload
  const triggerNextEpisode = () => {
    if (!nextEpisodeId) return;
    setIsAutoPlayActive(true);
    navigate({
      to: "/watch/$episodeId",
      params: { episodeId: nextEpisodeId },
      search: { a: resolvedAnimeId, autoplay: true },
    });
  };

  // Robust ended handler: fetch next episode from series state and perform silent auto-transition
  const handleEpisodeEnded = () => {
    if (!nextEpisodeId || !autoNext) return;
    setIsAutoPlayActive(true);
    triggerNextEpisode();
  };

  const toggleAutoNext = () => {
    const nextVal = !autoNext;
    setAutoNext(nextVal);
    localStorage.setItem("nonton-auto-next", String(nextVal));
  };

  // Save to history and reward EXP
  useEffect(() => {
    if (!stream.data) return;
    const animeTitle = anime.data?.title || stream.data.title;
    const poster = anime.data?.poster || "";
    saveHistory({
      episodeId,
      animeId: resolvedAnimeId,
      animeTitle,
      episodeTitle: stream.data.title,
      poster,
      watchedAt: Date.now(),
    });
    // Reward EXP for watching
    addExp(25, `Nonton ${stream.data.title || "Episode"}`);
  }, [stream.data, anime.data, resolvedAnimeId, episodeId]);

  const isInitialLoading = stream.isPending && !stream.data && !currentStreamUrl;
  if (isInitialLoading) return <LoadingState label="Menyiapkan episode & server streaming..." />;
  if (stream.error && !stream.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState error={stream.error} onRetry={() => stream.refetch()} />
      </div>
    );
  }

  const episodeData = stream.data || {
    title: episodeId.replace(/-/g, " "),
    releaseTime: null,
    downloads: [],
  };
  const animeTitle = anime.data?.title || episodeData.title;

  return (
    <div
      className={cn(
        "mx-auto px-4 py-6 transition-all duration-300",
        isTheater ? "max-w-full" : "max-w-7xl",
      )}
    >
      {/* Top Breadcrumb & Info */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 overflow-hidden">
          <Link to="/" className="hover:text-primary transition-colors shrink-0">
            Beranda
          </Link>
          <i className="fa-solid fa-chevron-right text-[10px] shrink-0" />
          {resolvedAnimeId ? (
            <>
              <Link
                to="/anime/$animeId"
                params={{ animeId: resolvedAnimeId }}
                className="hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-xs font-medium"
              >
                {animeTitle}
              </Link>
              <i className="fa-solid fa-chevron-right text-[10px] shrink-0" />
            </>
          ) : null}
          <span className="text-foreground font-semibold truncate">{episodeData.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShareButton title={episodeData.title} />
          {resolvedAnimeId ? (
            <Link
              to="/anime/$animeId"
              params={{ animeId: resolvedAnimeId }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1 font-medium text-foreground hover:bg-accent"
            >
              <i className="fa-solid fa-circle-info text-primary" />
              Detail Anime
            </Link>
          ) : null}
        </div>
      </div>

      {/* Main Layout: Video Player + Episode Selector */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left / Center Video Player Column */}
        <div
          className={cn("space-y-4", isTheater ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9")}
        >
          {/* Video Container with Ambient Light Effect */}
          <div className="relative group">
            {isAmbient ? (
              <div
                aria-hidden="true"
                className="absolute -inset-3 sm:-inset-6 -z-10 rounded-3xl bg-primary/25 blur-3xl opacity-70 transition-opacity duration-700 pointer-events-none"
              />
            ) : null}

            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-border/80">
              {isSleepTriggered ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center bg-black/95 p-6 text-center text-white space-y-3">
                  <span className="text-4xl">🌙</span>
                  <h3 className="text-base font-bold">Waktu Tidur Telah Tiba</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Pemutaran anime dihentikan otomatis oleh Sleep Timer untuk menghemat daya dan
                    kuota.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSleepTriggered(false)}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Lanjutkan Menonton
                  </button>
                </div>
              ) : (
                <VideoPlayer
                  src={currentStreamUrl}
                  isTheater={isTheater}
                  onToggleTheater={() => setIsTheater((prev) => !prev)}
                  onEnded={handleEpisodeEnded}
                  autoPlay={isAutoPlayActive}
                  episodeTitle={episodeData.title}
                  isLoading={stream.isFetching && !currentStreamUrl}
                  nextEpisode={nextEpisodeMetadata}
                  onPlayNext={triggerNextEpisode}
                />
              )}
            </div>
          </div>

          {/* Player Controls: Server selection + Navigation */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-sm">
            {/* Episode Title & Prev/Next Quick Navigation + Enhancements */}
            <div className="flex flex-col gap-3 border-b border-border/60 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="font-display text-base sm:text-lg font-bold text-foreground">
                    {episodeData.title}
                  </h1>
                  {episodeData.releaseTime ? (
                    <p className="text-xs text-muted-foreground">{episodeData.releaseTime}</p>
                  ) : null}
                </div>

                {/* Prev / Next buttons */}
                <div className="flex items-center gap-2">
                  {prevEpisodeId ? (
                    <Link
                      to="/watch/$episodeId"
                      params={{ episodeId: prevEpisodeId }}
                      search={{ a: resolvedAnimeId, autoplay: true }}
                      onClick={() => setIsAutoPlayActive(true)}
                      className="press-soft inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer"
                    >
                      <i className="fa-solid fa-backward-step" />
                      Eps Sebelumnya
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed"
                    >
                      <i className="fa-solid fa-backward-step" />
                      Eps Sebelumnya
                    </button>
                  )}

                  {nextEpisodeId ? (
                    <Link
                      to="/watch/$episodeId"
                      params={{ episodeId: nextEpisodeId }}
                      search={{ a: resolvedAnimeId, autoplay: true }}
                      onClick={() => setIsAutoPlayActive(true)}
                      className="press-soft inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                    >
                      Eps Berikutnya
                      <i className="fa-solid fa-forward-step" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed"
                    >
                      Eps Berikutnya
                      <i className="fa-solid fa-forward-step" />
                    </button>
                  )}
                </div>
              </div>

              {/* Watch Enhancements: Auto-Next, Cinema light, sleep timer, shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Fitur Pemutar:
                  </span>
                  {/* Auto-Next Episode Toggle Switch */}
                  <button
                    type="button"
                    onClick={toggleAutoNext}
                    title="Otomatis putar episode berikutnya saat episode selesai"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer",
                      autoNext
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <i className="fa-solid fa-forward-fast text-[10px]" />
                    Auto-Next: {autoNext ? "Aktif" : "Mati"}
                  </button>

                  {/* Manual Finish & Next Quick Action */}
                  {nextEpisodeId ? (
                    <button
                      type="button"
                      onClick={handleEpisodeEnded}
                      title="Tandai selesai & putar episode berikutnya"
                      className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-accent cursor-pointer"
                    >
                      <i className="fa-solid fa-check-double text-[10px] text-emerald-500" />
                      Selesai & Lanjut
                    </button>
                  ) : null}
                </div>

                <WatchEnhancements
                  isAmbient={isAmbient}
                  onToggleAmbient={() => setIsAmbient((prev) => !prev)}
                  onSleepExpired={() => setIsSleepTriggered(true)}
                />
              </div>
            </div>

            {/* Server Selector Bar */}
            {qualityGroups.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                      <i className="fa-solid fa-server text-primary mr-1.5" />
                      Pilihan Server
                    </span>
                    {isResolving ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <i className="fa-solid fa-circle-notch animate-spin text-[10px]" />
                        Mengganti server...
                      </span>
                    ) : null}
                  </div>

                  {/* Quality Filter Pills */}
                  <div className="flex items-center gap-1.5">
                    {qualityGroups.map((q) => (
                      <button
                        key={q.quality}
                        onClick={() => setSelectedQuality(q.quality)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                          selectedQuality === q.quality
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {q.quality}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Server list inside active quality */}
                {activeGroup && activeGroup.serverList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeGroup.serverList.map((srv) => {
                      const isSelected = selectedServerId === srv.serverId;
                      return (
                        <button
                          key={srv.serverId}
                          onClick={() => handleServerSelect(srv.serverId)}
                          disabled={isResolving}
                          className={cn(
                            "press-soft inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                            isSelected
                              ? "border-primary bg-primary/15 text-primary shadow-xs"
                              : "border-border/80 bg-background text-foreground hover:border-primary/50 hover:bg-accent",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isSelected ? "bg-primary" : "bg-muted-foreground/60",
                            )}
                          />
                          {srv.title}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Gunakan pemutar bawaan di atas.</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Download Links Section */}
          {episodeData.downloads && episodeData.downloads.length > 0 ? (
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <i className="fa-solid fa-download text-primary" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  Unduh Episode Ini
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  Berbagai pilihan resolusi & penyedia
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {episodeData.downloads.map((dl) => (
                  <div
                    key={dl.quality}
                    className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground bg-primary/15 text-primary px-2 py-0.5 rounded-md">
                        {dl.quality}
                      </span>
                      {dl.size ? (
                        <span className="font-semibold text-muted-foreground">{dl.size}</span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {dl.urls.map((link) => (
                        <a
                          key={link.title + link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="press-soft inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent hover:border-primary/50"
                        >
                          <i className="fa-solid fa-cloud-arrow-down text-[10px] text-primary" />
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Episode List Sidebar */}
        <div
          className={cn("space-y-4", isTheater ? "lg:col-span-12" : "lg:col-span-4 xl:col-span-3")}
        >
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-sm sticky top-20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-list-ul text-primary text-sm" />
                <h3 className="font-display text-sm font-bold text-foreground">Daftar Episode</h3>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {sortedEpisodes.length} Eps
              </span>
            </div>

            {/* Quick search episode filter */}
            {sortedEpisodes.length > 8 ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nomor episode..."
                  value={episodeFilter}
                  onChange={(e) => setEpisodeFilter(e.target.value)}
                  className="h-8 w-full rounded-lg border border-border/80 bg-background pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground" />
              </div>
            ) : null}

            {/* Scrollable list of episodes */}
            <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {filteredEpisodes.length > 0 ? (
                filteredEpisodes.map((ep) => {
                  const isActive = ep.id === episodeId;
                  return (
                    <Link
                      key={ep.id}
                      to="/watch/$episodeId"
                      params={{ episodeId: ep.id }}
                      search={{ a: resolvedAnimeId, autoplay: true }}
                      onClick={() => setIsAutoPlayActive(true)}
                      className={cn(
                        "press-soft flex items-center justify-between gap-2 rounded-xl p-2.5 text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "bg-background/80 text-card-foreground hover:bg-accent border border-border/60",
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isActive ? (
                          <i className="fa-solid fa-play text-[10px] animate-pulse" />
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
                            {ep.number}
                          </span>
                        )}
                        <span className="truncate">Episode {ep.number}</span>
                      </div>

                      {isActive ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider shrink-0">
                          Memutar
                        </span>
                      ) : null}
                    </Link>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Episode tidak ditemukan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
