import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import type { AnimeSummary } from "@/lib/anime-types";
import { WatchlistButton } from "./WatchlistButton";
import { cn } from "@/lib/utils";

export function HeroSlider({ items }: { items: AnimeSummary[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
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
    if (!emblaApi || items.length <= 1) return;
    timerRef.current = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [emblaApi, items.length]);

  if (items.length === 0) return null;

  return (
    <div className="group/slider relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((anime) => {
            const isOngoing =
              /ongoing|tayang/i.test(anime.status ?? "") || Boolean(anime.releaseDay);

            return (
              <div key={anime.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative min-h-[420px] w-full sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px]">
                  {/* Background atmosphere */}
                  {anime.poster ? (
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        src={anime.poster}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover object-center scale-110 blur-xl opacity-35 dark:opacity-25 transition-all duration-700"
                      />
                    </div>
                  ) : null}

                  {/* Gradient overlays for cinematic legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

                  {/* Content Container */}
                  <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10 md:p-12">
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-2xl space-y-4">
                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isOngoing ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-xs">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                              ONGOING
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-600/90 px-3 py-1 text-xs font-bold text-white shadow-xs">
                              <i className="fa-solid fa-circle-check text-xs" />
                              TAMAT
                            </span>
                          )}

                          {anime.episodeCount ? (
                            <span className="glass rounded-full px-3 py-1 text-xs font-semibold text-foreground">
                              {anime.episodeCount} Episode
                            </span>
                          ) : null}

                          {anime.releaseDay ? (
                            <span className="glass inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-foreground">
                              <i className="fa-solid fa-calendar text-[10px] text-primary" />
                              {anime.releaseDay}
                            </span>
                          ) : null}

                          <span className="glass rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                            Sub Indo
                          </span>
                        </div>

                        {/* Title */}
                        <h1 className="font-display text-2xl font-black tracking-tight text-foreground drop-shadow-md sm:text-4xl md:text-5xl lg:leading-tight">
                          {anime.title}
                        </h1>

                        {/* Subtitle / Day / Date */}
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm md:max-w-xl">
                          {anime.synopsis ||
                            `Tonton streaming dan unduh ${anime.title} subtitle Indonesia kualitas tinggi dan server cepat tanpa gangguan.`}
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <Link
                            to="/anime/$animeId"
                            params={{ animeId: anime.id }}
                            className="press-soft inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 active:scale-95"
                          >
                            <i className="fa-solid fa-play text-xs" />
                            Nonton Sekarang
                          </Link>

                          <WatchlistButton
                            animeId={anime.id}
                            title={anime.title}
                            poster={anime.poster}
                            variant="glass"
                          />
                        </div>
                      </div>

                      {/* Poster Preview Card (desktop) */}
                      {anime.poster ? (
                        <div className="hidden shrink-0 md:block">
                          <Link
                            to="/anime/$animeId"
                            params={{ animeId: anime.id }}
                            className="group/poster relative block w-40 overflow-hidden rounded-2xl border-2 border-white/15 shadow-2xl transition-transform duration-300 hover:scale-105 lg:w-48"
                          >
                            <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
                              <img
                                src={anime.poster}
                                alt={anime.title}
                                className="h-full w-full object-cover transition duration-500 group-hover/poster:scale-110"
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-2 inset-x-2 text-center text-[11px] font-semibold text-white truncate">
                              Lihat Detail
                            </div>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prev / Next controls */}
      {items.length > 1 ? (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Slide sebelumnya"
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-background/70 text-foreground shadow-lg backdrop-blur-md opacity-0 transition group-hover/slider:opacity-100 hover:bg-background active:scale-90 sm:flex"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Slide berikutnya"
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-background/70 text-foreground shadow-lg backdrop-blur-md opacity-0 transition group-hover/slider:opacity-100 hover:bg-background active:scale-90 sm:flex"
          >
            <i className="fa-solid fa-chevron-right text-sm" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 sm:bottom-6 sm:right-10">
            {items.map((anime, index) => (
              <button
                key={anime.id}
                aria-label={`Pindah ke slide ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === selected
                    ? "w-8 bg-primary shadow-sm shadow-primary/50"
                    : "w-2 bg-foreground/30 hover:bg-foreground/50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
