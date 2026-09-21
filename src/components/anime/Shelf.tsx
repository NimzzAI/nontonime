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
  icon?: LucideIcon | string;
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

  const renderIcon = () => {
    if (!IconProp) return null;
    if (typeof IconProp === "function") {
      const IconComp = IconProp;
      return <IconComp className="h-4 w-4" />;
    }
    if (typeof IconProp === "string" && IconProp.startsWith("fa-")) {
      return <i className={`${IconProp} text-sm`} />;
    }
    return null;
  };

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {IconProp ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {renderIcon()}
            </span>
          ) : null}
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
              <span>Lihat semua</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Gulir ke kiri"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-secondary/50 text-foreground transition hover:bg-secondary active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Gulir ke kanan"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-secondary/50 text-foreground transition hover:bg-secondary active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
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
