import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { FloatingTools } from "@/components/anime/FloatingTools";
import { completedQuery } from "@/lib/queries";
import { ArrowDownAZ, CheckCircle2, Flame, Search, SlidersHorizontal, Star } from "lucide-react";

export const Route = createFileRoute("/tamat")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search["page"] ?? 1) || 1,
  }),
  loader: async ({ context, location }) => {
    const searchParams = new URLSearchParams(location.searchStr);
    const page = Number(searchParams.get("page") ?? 1) || 1;
    try {
      await context.queryClient.ensureQueryData(completedQuery(page));
    } catch {
      // Fallback
    }
  },
  head: () => ({
    meta: [
      { title: "Anime Tamat (Completed) — Nontonime" },
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
  const [filterKeyword, setFilterKeyword] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "rating" | "az">("default");

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = [...data.items];

    if (filterKeyword.trim()) {
      const q = filterKeyword.toLowerCase().trim();
      items = items.filter((item) => item.title.toLowerCase().includes(q));
    }

    if (sortBy === "rating") {
      items.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    } else if (sortBy === "az") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    return items;
  }, [data?.items, filterKeyword, sortBy]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-xs">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Anime Tamat (Completed)
            </h1>
            <p className="text-xs text-muted-foreground">
              Koleksi serial anime yang sudah selesai tayang, siap dimaraton sampai tamat.
            </p>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search in-page */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder="Saring judul..."
              className="h-9 w-full rounded-xl border border-border/80 bg-secondary/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/30 p-1">
            <button
              type="button"
              onClick={() => setSortBy("default")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "default"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => setSortBy("rating")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "rating"
                  ? "bg-card text-amber-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="h-3 w-3 fill-amber-400" />
              <span>Skor</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy("az")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "az"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownAZ className="h-3 w-3" />
              <span>A-Z</span>
            </button>
          </div>
        </div>
      </div>

      {isPending ? <GridSkeleton /> : null}
      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}

      {data ? (
        <>
          {filteredItems.length > 0 ? (
            <AnimeGrid items={filteredItems} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Tidak ada anime tamat yang cocok dengan &quot;{filterKeyword}&quot; di halaman ini.
              </p>
            </div>
          )}

          <Pagination
            page={page}
            hasNext={data.hasNext}
            onChange={(next) => navigate({ to: "/tamat", search: { page: next } })}
          />
        </>
      ) : null}

      {/* Floating Tools */}
      <FloatingTools />
    </div>
  );
}
