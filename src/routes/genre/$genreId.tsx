import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { genreAnimeQuery } from "@/lib/queries";

export const Route = createFileRoute("/genre/$genreId")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search["page"] ?? 1) || 1,
    name: search["name"] ? String(search["name"]) : undefined,
  }),
  head: ({ params, search }) => {
    const name = search.name ?? `#${params.genreId}`;
    return {
      meta: [
        { title: `Anime Genre ${name} : Nontonime` },
        {
          name: "description",
          content: `Kumpulan anime bergenre ${name} dengan subtitle Indonesia.`,
        },
        { property: "og:title", content: `Anime Genre ${name} : Nontonime` },
        {
          property: "og:description",
          content: `Kumpulan anime bergenre ${name} subtitle Indonesia.`,
        },
      ],
    };
  },
  component: GenreDetailPage,
});

function GenreDetailPage() {
  const { genreId } = Route.useParams();
  const { page, name } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(genreAnimeQuery(genreId, page));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <SectionTitle title={`Genre: ${name ?? `#${genreId}`}`} icon={Tag} />
      {isPending ? <GridSkeleton /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        <>
          <AnimeGrid items={data.items} />
          <Pagination
            page={page}
            hasNext={data.hasNext}
            onChange={(next) =>
              navigate({ to: "/genre/$genreId", params: { genreId }, search: { page: next, name } })
            }
          />
        </>
      ) : null}
    </div>
  );
}
