import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import type { AnimeSummary } from "@/lib/anime-types";
import { WatchlistButton } from "./WatchlistButton";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Star,
} from "lucide-react";

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
      className="group/slider relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-xl"
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((anime) => {
            const isOngoing =
              /ongoing|tayang/i.test(anime.status ?? "") || Boolean(anime.releaseDay);

            return (
              <div key={anime.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative flex flex-col w-full overflow-hidden p-4 sm:p-6 md:p-7 lg:p-8 space-y-3 sm:space-y-4">
                  {/* Atmospheric Backdrop */}
                  {anime.poster ? (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                      <img
                        src={anime.poster}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        loading="lazy"
                        className="h-full w-full object-cover object-center opacity-15 dark:opacity-20"
                      />
                      {/* Gradient Masks for Clean Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-card/50" />
                      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent hidden md:block" />
                    </div>
                  ) : null}

                  {/* Top Tagline / Status */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isOngoing ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold text-white shadow-md shadow-emerald-500/20 backdrop-blur-xs">
                          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white shadow-xs" />
                          </span>
                          ONGOING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-600/90 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold text-white shadow-md shadow-sky-600/20 backdrop-blur-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          TAMAT
                        </span>
                      )}

                      <span className="inline-flex items-center rounded-full border border-border/80 bg-secondary/80 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-foreground">
                        Pilihan Editor
                      </span>

                      {anime.episodeCount ? (
                        <span className="hidden sm:inline-flex rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {anime.episodeCount} Episode
                        </span>
                      ) : null}

                      {anime.releaseDay ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Calendar className="h-3 w-3 text-primary" />
                          {anime.releaseDay}
                        </span>
                      ) : null}
                    </div>

                    {/* Score Badge Top Right */}
                    {anime.score ? (
                      <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>{anime.score}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Middle Section: Split Content with PROMINENT POSTER THUMBNAIL */}
                  <div className="relative z-10 my-2 sm:my-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Left: Text & Actions */}
                    <div className="max-w-2xl space-y-3 sm:space-y-4">
                      {/* Mobile Layout: Inline Poster + Title */}
                      <div className="flex items-start gap-3.5 md:hidden">
                        {anime.poster ? (
                          <Link
                            to="/anime/$animeId"
                            params={{ animeId: anime.id }}
                            className="relative shrink-0 block w-20 sm:w-24 aspect-[3/4] overflow-hidden rounded-xl border border-border/70 shadow-md bg-muted"
                          >
                            <img
                              src={anime.poster}
                              alt={anime.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[8px] font-bold text-white">
                              HD
                            </div>
                          </Link>
                        ) : null}

                        <div className="min-w-0 flex-1 space-y-1">
                          <h1 className="line-clamp-2 font-display text-base sm:text-xl font-black tracking-tight text-foreground">
                            {anime.title}
                          </h1>
                          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {anime.synopsis ||
                              `Streaming anime ${anime.title} subtitle Indonesia kualitas jernih tanpa ribet.`}
                          </p>
                        </div>
                      </div>

                      {/* Desktop Title & Synopsis */}
                      <div className="hidden md:block space-y-2">
                        <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl lg:leading-tight">
                          {anime.title}
                        </h1>
                        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm max-w-xl">
                          {anime.synopsis ||
                            `Streaming dan download ${anime.title} subtitle Indonesia resolusi 360p, 480p, hingga 720p HD dengan multi-server tercepat.`}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 sm:px-5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                        >
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                          <span>Nonton Sekarang</span>
                        </Link>

                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary active:scale-95"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
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
                    {anime.poster ? (
                      <div className="hidden shrink-0 md:block">
                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: anime.id }}
                          className="group/poster relative block w-40 lg:w-48 aspect-[3/4] overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-xl transition-transform duration-300 hover:scale-105"
                        >
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            decoding="async"
                            loading="lazy"
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
