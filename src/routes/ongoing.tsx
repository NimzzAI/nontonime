import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { ongoingQuery } from "@/lib/queries";

export const Route = createFileRoute("/ongoing")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search["page"] ?? 1) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Anime Ongoing — Nontonime" },
      { name: "description", content: "Daftar anime yang sedang tayang musim ini dengan subtitle Indonesia." },
      { property: "og:title", content: "Anime Ongoing — Nontonime" },
      { property: "og:description", content: "Daftar anime yang sedang tayang musim ini subtitle Indonesia." },
    ],
  }),
  component: OngoingPage,
});

function OngoingPage() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(ongoingQuery(page));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <SectionTitle title="Anime Sedang Tayang" icon="fa-solid fa-tower-broadcast" />
      {isPending ? <GridSkeleton /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        <>
          <AnimeGrid items={data.items} />
          <Pagination page={page} hasNext={data.hasNext} onChange={(next) => navigate({ to: "/ongoing", search: { page: next } })} />
        </>
      ) : null}
    </div>
  );
}
