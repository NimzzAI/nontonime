import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag, Sparkles } from "lucide-react";
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

  const displayName = name ?? genreId.replace(/-/g, " ");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <SectionTitle title={`Genre: ${displayName}`} icon={Tag} />
      {isPending ? <GridSkeleton /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        data.items.length > 0 ? (
          <>
            <AnimeGrid items={data.items} />
            <Pagination
              page={page}
              hasNext={data.hasNext}
              onChange={(next) =>
                navigate({
                  to: "/genre/$genreId",
                  params: { genreId },
                  search: { page: next, name },
                })
              }
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Belum Ada Anime di Genre Ini
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
              Koleksi anime untuk genre ini sedang diperbarui. Coba jelajahi genre lainnya atau cari
              anime favoritmu.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                to="/genre"
                className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
              >
                Lihat Semua Genre
              </Link>
              <Link
                to="/"
                className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-all"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
