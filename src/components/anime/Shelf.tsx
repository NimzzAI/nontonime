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
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          <i className={`${icon} text-primary`} />
          {title}
        </h2>
        {viewAllTo ? (
          <Link
            to={viewAllTo as never}
            search={viewAllSearch as never}
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        ) : null}
      </div>
      {isLoading ? (
        <RowSkeleton />
      ) : (
        <div className="edge-fade no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {items.map((anime) => (
            <div key={anime.id} className="w-32 shrink-0 sm:w-40">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
