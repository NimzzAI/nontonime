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
    <div className="relative overflow-hidden rounded-3xl border border-border shadow-lg">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((anime) => {
            const isOngoing = /ongoing|tayang/i.test(anime.status ?? "");
            return (
              <div key={anime.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative h-[420px] w-full sm:h-[480px] md:h-[540px]">
                  {anime.cover || anime.poster ? (
                    <img
                      src={anime.cover ?? anime.poster ?? ""}
                      alt={anime.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 space-y-4 p-6 sm:p-10">
                    {isOngoing ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-highlight px-2.5 py-1 text-[11px] font-bold text-highlight-foreground">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-highlight-foreground" />
                        TAYANG SEKARANG
                      </span>
                    ) : null}
                    <h2 className="max-w-2xl font-display text-2xl font-bold leading-tight tracking-tight text-foreground text-shadow-soft sm:text-4xl">
                      {anime.title}
                    </h2>
                    {anime.genres.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {anime.genres.slice(0, 4).map((genre) => (
                          <span
                            key={genre}
                            className="glass rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {anime.synopsis ? (
                      <p className="hidden max-w-xl text-sm leading-relaxed text-muted-foreground sm:line-clamp-2 md:block">
                        {anime.synopsis}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-3">
                      <Link
                        to="/anime/$animeId"
                        params={{ animeId: anime.id }}
                        className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                      >
                        <i className="fa-solid fa-play" />
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

      {items.length > 1 ? (
        <div className="absolute bottom-4 right-4 flex gap-1.5 sm:right-6">
          {items.map((anime, index) => (
            <button
              key={anime.id}
              aria-label={`Slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === selected ? "w-6 bg-primary" : "w-1.5 bg-white/40",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
