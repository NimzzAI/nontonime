import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { AnimeSummary } from "@/lib/anime-types";
import { AnimeCard } from "./AnimeCard";
import { RowSkeleton } from "./StateViews";
import { ArrowRight, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

export function Shelf({
  title,
  icon: IconProp,
  items,
  isLoading,
  viewAllTo,
  viewAllSearch,
}: {
  title: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
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

  const IconComp = IconProp as React.ElementType | undefined;

  return (
    <section className="relative z-10 space-y-4 my-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pb-2 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          {IconComp ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground border border-border/80 shrink-0">
              <IconComp className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {viewAllTo ? (
            <Link
              to={viewAllTo as never}
              search={viewAllSearch as never}
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Lihat semua</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-primary" />
            </Link>
          ) : null}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Gulir ke kiri"
              className="noir-button-secondary flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Gulir ke kanan"
              className="noir-button-secondary flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <RowSkeleton />
      ) : (
        <div
          ref={scrollRef}
          className="edge-fade no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto scroll-smooth px-4 pt-1 pb-4 items-stretch"
        >
          {items.map((anime) => (
            <div key={anime.id} className="w-38 shrink-0 sm:w-44 flex flex-col">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
