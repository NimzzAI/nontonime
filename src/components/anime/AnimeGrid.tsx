import type { AnimeSummary } from "@/lib/anime-types";
import { AnimeCard } from "./AnimeCard";
import { EmptyState } from "./StateViews";

export function AnimeGrid({ items }: { items: AnimeSummary[] }) {
  if (items.length === 0) {
    return <EmptyState icon="fa-solid fa-ghost" message="Tidak ada anime untuk ditampilkan di sini." />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
}
