import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AnimeListRow } from "@/components/anime/AnimeListRow";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { searchQuery } from "@/lib/queries";

export const Route = createFileRoute("/cari")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: String(search["q"] ?? ""),
    page: Number(search["page"] ?? 1) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Cari Anime : Nontonime" },
      {
        name: "description",
        content: "Cari judul anime subtitle Indonesia dari katalog Nontonime.",
      },
      { property: "og:title", content: "Cari Anime : Nontonime" },
      {
        property: "og:description",
        content: "Cari judul anime subtitle Indonesia dari katalog Nontonime.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, page } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const { data, isPending, error, refetch } = useQuery(searchQuery(q, page));

  useEffect(() => {
    setTerm(q);
  }, [q]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <SectionTitle title="Cari Anime" icon={Search} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ to: "/cari", search: { q: term.trim(), page: 1 } });
        }}
        className="flex gap-2"
      >
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ketik judul anime..."
          className="h-11 flex-1 rounded-full border border-border bg-card px-4 text-sm text-card-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer">
          <Search className="h-4 w-4" />
          Cari
        </button>
      </form>

      {!q ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Masukkan kata kunci untuk mulai mencari.
        </p>
      ) : null}
      {q && isPending ? <GridSkeleton count={6} /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {q && data && data.items.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hasil Pencarian
          </p>
          <div className="space-y-2">
            {data.items.map((anime) => (
              <AnimeListRow key={anime.id} anime={anime} />
            ))}
          </div>
          <Pagination
            page={page}
            hasNext={data.hasNext}
            onChange={(next) => navigate({ to: "/cari", search: { q, page: next } })}
          />
        </div>
      ) : null}

      {q && data && data.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Tidak ditemukan anime dengan judul "{q}".
        </p>
      ) : null}
    </div>
  );
}
