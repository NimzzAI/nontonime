import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { genreListQuery } from "@/lib/queries";

export const Route = createFileRoute("/genre/")({
  head: () => ({
    meta: [
      { title: "Daftar Genre Anime — Nontonime" },
      { name: "description", content: "Jelajahi anime berdasarkan genre: action, romance, fantasy, dan lainnya." },
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
      <SectionTitle title="Daftar Genre" icon="fa-solid fa-tags" />
      {isPending ? <GridSkeleton count={12} /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.map((genre) => (
            <Link
              key={genre.id}
              to="/genre/$genreId"
              params={{ genreId: genre.id }}
              search={{ page: 1, name: genre.name }}
              className="card-lift group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative h-24 w-full overflow-hidden bg-muted">
                {genre.image ? (
                  <img
                    src={genre.image}
                    alt={genre.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              </div>
              <p className="absolute inset-x-0 bottom-0 p-3 text-center text-sm font-semibold text-foreground">
                {genre.name}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
