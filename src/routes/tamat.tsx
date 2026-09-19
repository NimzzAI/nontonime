import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { completedQuery } from "@/lib/queries";

export const Route = createFileRoute("/tamat")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search["page"] ?? 1) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Anime Tamat — Nontonime" },
      { name: "description", content: "Daftar anime yang sudah tamat dengan subtitle Indonesia." },
      { property: "og:title", content: "Anime Tamat — Nontonime" },
      { property: "og:description", content: "Daftar anime yang sudah tamat subtitle Indonesia." },
    ],
  }),
  component: CompletedPage,
});

function CompletedPage() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(completedQuery(page));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <SectionTitle title="Anime Tamat" icon="fa-solid fa-circle-check" />
      {isPending ? <GridSkeleton /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        <>
          <AnimeGrid items={data.items} />
          <Pagination page={page} hasNext={data.hasNext} onChange={(next) => navigate({ to: "/tamat", search: { page: next } })} />
        </>
      ) : null}
    </div>
  );
}
