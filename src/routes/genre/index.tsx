import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, GridSkeleton } from "@/components/anime/StateViews";
import { genreListQuery } from "@/lib/queries";
import { Tags } from "lucide-react";

export const Route = createFileRoute("/genre/")({
  head: () => ({
    meta: [
      { title: "Daftar Genre Anime — Nontonime" },
      {
        name: "description",
        content: "Jelajahi anime berdasarkan genre: action, romance, fantasy, dan lainnya.",
      },
      { property: "og:title", content: "Daftar Genre Anime — Nontonime" },
      { property: "og:description", content: "Jelajahi anime berdasarkan genre favoritmu." },
    ],
  }),
  component: GenrePage,
});

function GenrePage() {
  const { data, isPending, error, refetch } = useQuery(genreListQuery());

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Tags className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Daftar Genre Anime
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Temukan ribuan judul anime berdasarkan kategori dan tema cerita
          </p>
        </div>
      </div>

      {isPending ? <GridSkeleton count={15} /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data.map((genre) => (
            <Link
              key={genre.id}
              to="/genre/$genreId"
              params={{ genreId: genre.id }}
              search={{ page: 1, name: genre.name }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary hover:bg-secondary/40 hover:shadow-md active:scale-98"
            >
              <span className="font-display text-base font-bold text-foreground transition-colors group-hover:text-primary">
                {genre.name}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground mt-2">
                Jelajahi Kategori &rarr;
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
