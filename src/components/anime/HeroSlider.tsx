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
    timerRef.current = setInterval(() => emblaApi.scrollNext(), 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [emblaApi, items.length]);

  if (items.length === 0) return null;

  return (
    <div className="group/slider relative overflow-hidden rounded-3xl border border-border/80 shadow-xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((anime) => {
            const isOngoing = /ongoing|tayang/i.test(anime.status ?? "");
            return (
              <div key={anime.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative h-[400px] w-full sm:h-[460px] md:h-[520px]">
                  {anime.cover || anime.poster ? (
                    <img
                      src={anime.cover ?? anime.poster ?? ""}
                      alt={anime.title}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                  {/* Atmospheric gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 space-y-3.5 p-6 sm:p-10">
                    <div className="flex items-center gap-2">
                      {isOngoing ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-xs">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                          TAYANG SEKARANG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                          <i className="fa-solid fa-fire text-xs" />
                          REKOMENDASI
                        </span>
                      )}
                      {anime.year ? (
                        <span className="glass rounded-full px-2.5 py-1 text-xs font-medium text-foreground">
                          {anime.year}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="max-w-3xl font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground drop-shadow-md sm:text-4xl md:text-5xl">
                      {anime.title}
                    </h2>

                    {anime.genres.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {anime.genres.slice(0, 4).map((genre) => (
                          <span
                            key={genre}
                            className="glass rounded-full px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur-md"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {anime.synopsis ? (
                      <p className="hidden max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-2 md:block">
                        {anime.synopsis}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-3 pt-1">
                      <Link
                        to="/anime/$animeId"
                        params={{ animeId: anime.id }}
                        className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-95"
                      >
                        <i className="fa-solid fa-play text-xs" />
                        Tonton Sekarang
                      </Link>
                      <WatchlistButton
                        animeId={anime.id}
                        title={anime.title}
                        poster={anime.poster}
                        variant="glass"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prev / Next controls on desktop */}
      {items.length > 1 ? (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Slide sebelumnya"
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md opacity-0 transition group-hover/slider:opacity-100 hover:bg-black/70 sm:flex"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Slide berikutnya"
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md opacity-0 transition group-hover/slider:opacity-100 hover:bg-black/70 sm:flex"
          >
            <i className="fa-solid fa-chevron-right text-sm" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-4 flex gap-1.5 sm:right-8 sm:bottom-8">
            {items.map((anime, index) => (
              <button
                key={anime.id}
                aria-label={`Slide ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === selected ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
