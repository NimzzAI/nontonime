import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { AnimeCard } from "./AnimeCard";
import { RowSkeleton } from "./StateViews";

export function Shelf({
  title,
  icon,
  items,
  isLoading,
  viewAllTo,
  viewAllSearch,
}: {
  title: string;
  icon: string;
  items: AnimeSummary[];
  isLoading?: boolean;
  viewAllTo?: string;
  viewAllSearch?: Record<string, unknown>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isLoading && items.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -480 : 480;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <i className={`${icon} text-sm`} />
          </span>
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllTo ? (
            <Link
              to={viewAllTo as never}
              search={viewAllSearch as never}
              className="group inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80 sm:text-sm"
            >
              Lihat semua
              <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => scroll("left")}
              aria-label="Gulir ke kiri"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground active:scale-95"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Gulir ke kanan"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground active:scale-95"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <RowSkeleton />
      ) : (
        <div
          ref={scrollRef}
          className="edge-fade no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          {items.map((anime) => (
            <div key={anime.id} className="w-36 shrink-0 sm:w-44">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
