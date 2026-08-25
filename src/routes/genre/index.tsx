import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState, SectionTitle } from "@/components/anime/StateViews";
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
      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.data.genreList.map((genre) => (
            <Link
              key={genre.genreId}
              to="/genre/$genreId"
              params={{ genreId: genre.genreId }}
              search={{ page: 1 }}
              className="press-soft rounded-full border border-border bg-card px-4 py-3 text-center text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
            >
              {genre.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
