import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import type { AnimeSummary } from "@/lib/anime-types";
import { WatchlistButton } from "./WatchlistButton";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Info, Play, Star } from "lucide-react";
import { getSafePosterUrl } from "@/lib/poster";

export function HeroSlider({ items }: { items: AnimeSummary[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selected, setSelected] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || items.length <= 1 || isHovered) return;

    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (!document.hidden) {
          emblaApi.scrollNext();
        }
      }, 6000);
    };

    startTimer();

    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [emblaApi, items.length, isHovered]);

  if (items.length === 0) return null;

  return (
    <div
      id="home-hero-slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/slider relative overflow-hidden rounded-2xl border border-border/80 dark:border-white/10 noir-frame shadow-xl hero-slide"
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((anime) => {
            const currentYear = new Date().getFullYear();
            const yearNum = anime.year ? parseInt(anime.year, 10) : null;
            const isPastYear = yearNum !== null && yearNum > 1900 && yearNum < currentYear;
            const isCompleted =
              /tamat|complete|finish|selesai|ended/i.test(anime.status ?? "") ||
              (isPastYear && !/ongoing|tayang/i.test(anime.status ?? ""));
            const isOngoing =
              !isCompleted &&
              (/ongoing|tayang/i.test(anime.status ?? "") ||
                (Boolean(anime.releaseDay) && !isPastYear));
            const posterUrl = getSafePosterUrl(anime.poster, anime.title);

            return (
              <div
                key={anime.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full hero-slide"
              >
                <div className="relative flex flex-col w-full overflow-hidden p-5 sm:p-7 md:p-8 lg:p-10 space-y-3 sm:space-y-4">
                  {/* Atmospheric Backdrop */}
                  {posterUrl ? (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                      <img
                        src={posterUrl}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center opacity-20 filter contrast-105"
                      />
                      {/* Gradient Masks for Clean Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/90 to-surface/60" />
                      <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-transparent hidden md:block" />
                    </div>
                  ) : null}

                  {/* Top Tagline / Status */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="noir-kicker">
                        {isOngoing ? "ONGOING" : isCompleted ? "TAMAT" : "FEATURED"}
                      </span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        Pilihan Editor
                      </span>
                      {anime.episodeCount ? (
                        <>
                          <span className="text-muted-foreground/30 hidden sm:inline">·</span>
                          <span className="text-xs font-mono text-muted-foreground/75 hidden sm:inline">
                            {anime.episodeCount} Eps
                          </span>
                        </>
                      ) : null}
                      {anime.releaseDay ? (
                        <>
                          <span className="text-muted-foreground/30 hidden sm:inline">·</span>
                          <span className="text-xs font-mono text-muted-foreground/75 hidden sm:inline">
                            {anime.releaseDay}
                          </span>
                        </>
                      ) : null}
                    </div>

                    {/* Score Badge Top Right */}
                    {anime.score ? (
                      <div className="flex items-center gap-1.5 rounded-sm border border-white/15 bg-black/60 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{anime.score}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Middle Section: Split Content with PROMINENT POSTER THUMBNAIL */}
                  <div className="relative z-10 my-2 sm:my-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Left: Text & Actions */}
                    <div className="max-w-2xl space-y-3 sm:space-y-4">
                      {/* Mobile Layout: Inline Poster + Title */}
                      <div className="flex items-start gap-3.5 md:hidden">
                        {posterUrl ? (
                          <Link
                            to="/anime/$animeId"
                            params={{ animeId: anime.id }}
                            className="relative shrink-0 block w-20 sm:w-24 aspect-[3/4] overflow-hidden rounded-lg border border-white/15 shadow-md bg-black/50"
                          >
                            <img
                              src={posterUrl}
                              alt={anime.title}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[8px] font-mono font-bold text-white">
                              HD
                            </div>
                          </Link>
                        ) : null}

                        <div className="min-w-0 flex-1 space-y-1">
                          <h1
                            className="line-clamp-2 font-display text-lg sm:text-2xl font-bold tracking-tight text-ink"
                            style={{ textWrap: "balance" }}
                          >
                            {anime.title}
                          </h1>
                          <p className="line-clamp-2 text-xs text-ink-dim leading-relaxed">
                            {anime.synopsis ||
                              `Streaming anime ${anime.title} subtitle Indonesia kualitas jernih tanpa ribet.`}
                          </p>
                        </div>
                      </div>

                      {/* Desktop Title & Synopsis */}
                      <div className="hidden md:block space-y-2">
                        <h1
                          className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl lg:leading-tight"
                          style={{ textWrap: "balance" }}
                        >
                          {anime.title}
                        </h1>
                        <p className="line-clamp-3 text-xs leading-relaxed text-ink-dim sm:text-sm max-w-xl">
                          {anime.synopsis ||
                            `Streaming dan download ${anime.title} subtitle Indonesia resolusi 360p, 480p, hingga 720p HD dengan multi-server tercepat.`}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 pt-2">
                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="noir-button inline-flex h-9 sm:h-10 items-center gap-2 rounded-lg bg-primary px-4 sm:px-6 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg shadow-black/40 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          <span>Nonton Sekarang</span>
                        </Link>

                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="noir-button-secondary inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/80 px-4 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                        >
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="hidden sm:inline">Detail Anime</span>
                        </Link>

                        <WatchlistButton
                          animeId={anime.id}
                          title={anime.title}
                          poster={anime.poster}
                          variant="solid"
                        />
                      </div>
                    </div>

                    {/* Desktop PROMINENT POSTER CARD (Crisp, High-Resolution Preview) */}
                    {posterUrl ? (
                      <div className="hidden shrink-0 md:block">
                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="group/poster relative block w-40 lg:w-48 aspect-[3/4] overflow-hidden rounded-xl border border-border/80 dark:border-white/15 bg-card shadow-2xl transition-transform duration-300 hover:scale-105"
                        >
                          <img
                            src={posterUrl}
                            alt={anime.title}
                            decoding="async"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/poster:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-end justify-center p-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md">
                              <Play className="h-3 w-3 fill-current" />
                              Lihat Detail
                            </span>
                          </div>
                          {anime.score ? (
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-xs">
                              <Star className="h-3 w-3 fill-amber-400" />
                              {anime.score}
                            </div>
                          ) : null}
                          <div className="absolute top-2.5 right-2.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                            SUB INDO
                          </div>
                        </Link>
                      </div>
                    ) : null}
                  </div>

                  {/* Bottom Indicator / Controls */}
                  <div className="relative z-10 flex items-center justify-between pt-2.5 mt-1 border-t border-border/50">
                    <div className="text-[11px] font-mono text-muted-foreground">
                      <span className="font-bold text-foreground">
                        {String(selected + 1).padStart(2, "0")}
                      </span>
                      <span className="mx-1">/</span>
                      <span>{String(items.length).padStart(2, "0")}</span>
                    </div>

                    {/* Interactive Slide Indicator Pills */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {items.map((slideAnime, index) => (
                        <button
                          key={slideAnime.id}
                          type="button"
                          aria-label={`Lihat slide ${index + 1}: ${slideAnime.title}`}
                          onClick={() => emblaApi?.scrollTo(index)}
                          className={cn(
                            "group/thumb relative h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                            index === selected
                              ? "w-8 bg-primary shadow-sm shadow-primary/60"
                              : "w-2.5 bg-foreground/20 hover:bg-foreground/50",
                          )}
                        />
                      ))}
                    </div>

                    {/* Slide Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => emblaApi?.scrollPrev()}
                        aria-label="Anime sebelumnya"
                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border/80 bg-secondary/50 text-foreground transition hover:bg-secondary active:scale-95"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => emblaApi?.scrollNext()}
                        aria-label="Anime berikutnya"
                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border/80 bg-secondary/50 text-foreground transition hover:bg-secondary active:scale-95"
                      >
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
