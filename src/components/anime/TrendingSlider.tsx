import { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { AnimeSummary } from "@/lib/anime-types";
import { WatchlistButton } from "./WatchlistButton";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Play,
  Star,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TrendingSlider({ items }: { items: AnimeSummary[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleCheckScroll = () => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Calculate approximate active card
      const cardWidth = 340;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleCheckScroll);
        ticking = true;
      }
    };

    handleCheckScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const step = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4 pt-1">
      {/* Header bar with rank indicator & navigation arrows */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Flame className="h-4 w-4 fill-current" />
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Trending Anime
            </h2>
            <span className="hidden sm:inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
              Paling Banyak Ditonton
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Serial anime dengan lonjakan penonton tertinggi saat ini
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Slider Arrow Controls */}
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Geser ke kiri"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Geser ke kanan"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Slider Track with Edge-to-Edge Cards */}
      <div
        ref={scrollRef}
        className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-1 snap-x snap-mandatory scroll-smooth"
      >
        {items.map((anime, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const isOngoing = /ongoing|tayang/i.test(anime.status ?? "") || Boolean(anime.releaseDay);
          const isCompleted = /tamat|complete/i.test(anime.status ?? "");

          return (
            <div
              key={anime.id}
              className="group relative w-[280px] sm:w-[360px] md:w-[420px] shrink-0 snap-start select-none"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 bg-muted shadow-lg transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-2xl group-hover:shadow-primary/20">
                {/* Large Edge-to-Edge Image with Hover-Zoom Effect */}
                {anime.poster ? (
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card">
                    <Flame className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}

                {/* Multilayer High-Contrast Cinematic Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/30" />

                {/* Top Overlay Row: Rank Badge + Score + Watchlist */}
                <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
                  {/* Rank Badge with glowing accents */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black shadow-lg backdrop-blur-md",
                      isTop3
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-amber-500/30"
                        : "bg-black/70 text-white border border-white/20",
                    )}
                  >
                    <span className="font-mono text-xs">#{rank}</span>
                    <span className="text-[10px] tracking-wider uppercase">TRENDING</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {anime.score ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-white/10">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {anime.score}
                      </span>
                    ) : null}

                    {/* Spring-based Watchlist Toggle Button */}
                    <WatchlistButton
                      animeId={anime.id}
                      title={anime.title}
                      poster={anime.poster}
                      variant="card-overlay"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Bottom Content Area: Anime Title, Meta, and Action Button */}
                <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4.5 space-y-2 z-10">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-white/90">
                    {isOngoing ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/90 px-1.5 py-0.5 text-white">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        ONGOING
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-600/90 px-1.5 py-0.5 text-white">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        TAMAT
                      </span>
                    ) : null}

                    {anime.episodeCount ? (
                      <span className="inline-flex items-center gap-1 rounded bg-white/15 px-1.5 py-0.5 text-white/95 backdrop-blur-xs">
                        <Layers className="h-2.5 w-2.5 text-primary" />
                        {anime.episodeCount} Eps
                      </span>
                    ) : null}

                    <span className="text-white/70">
                      {anime.type || "TV"} {anime.releaseDay ? `· ${anime.releaseDay}` : ""}
                    </span>
                  </div>

                  <Link
                    to="/anime/$animeId"
                    params={{ animeId: anime.id }}
                    className="block group/link"
                  >
                    <h3 className="line-clamp-1 font-display text-sm sm:text-base md:text-lg font-extrabold text-white transition-colors group-hover/link:text-primary drop-shadow-md">
                      {anime.title}
                    </h3>
                  </Link>

                  {/* Interactive Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <Link
                      to="/anime/$animeId"
                      params={{ animeId: anime.id }}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-102 active:scale-95"
                    >
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      Nonton Sekarang
                    </Link>

                    <Link
                      to="/anime/$animeId"
                      params={{ animeId: anime.id }}
                      className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
                    >
                      Detail Anime →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
