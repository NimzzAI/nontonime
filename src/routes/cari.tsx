import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, Filter, X, Film } from "lucide-react";
import { AnimeListRow } from "@/components/anime/AnimeListRow";
import { Pagination } from "@/components/anime/Pagination";
import { ErrorState, GridSkeleton, SectionTitle } from "@/components/anime/StateViews";
import { searchQuery, genreAnimeQuery } from "@/lib/queries";
import { parseId, toAnimeId, toEpisodeId } from "@/lib/sources/ids";
import { GenreFilterBar, ALL_GENRE_OPTIONS } from "@/components/anime/GenreFilterBar";
import { SearchFilterPanel } from "@/components/anime/SearchFilterPanel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cari")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: String(search["q"] ?? ""),
    page: Number(search["page"] ?? 1) || 1,
    genre: String(search["genre"] ?? ""),
    status: String(search["status"] ?? "all"),
  }),
  head: () => ({
    meta: [
      { title: "Cari & Filter Anime : Nontonime" },
      {
        name: "description",
        content:
          "Cari judul anime subtitle Indonesia dan filter berdasarkan genre seperti Action, Slice of Life, atau Fantasy.",
      },
      { property: "og:title", content: "Cari & Filter Anime : Nontonime" },
      {
        property: "og:description",
        content:
          "Cari judul anime subtitle Indonesia dan filter berdasarkan genre seperti Action, Slice of Life, atau Fantasy.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, page, genre, status } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If query is present, search by term. If query is empty but genre is selected, query by genre
  const activeTerm = q.trim();
  const activeGenre = genre.trim();

  const {
    data: searchData,
    isPending: isSearchPending,
    error: searchError,
    refetch: refetchSearch,
  } = useQuery({
    ...searchQuery(activeTerm || (activeGenre ? activeGenre : "a"), page),
    enabled: Boolean(activeTerm || !activeGenre),
  });

  const {
    data: genreData,
    isPending: isGenrePending,
    error: genreError,
    refetch: refetchGenre,
  } = useQuery({
    ...genreAnimeQuery(activeGenre, page),
    enabled: Boolean(!activeTerm && activeGenre),
  });

  const rawItems = useMemo(
    () =>
      activeTerm
        ? (searchData?.items ?? [])
        : activeGenre
          ? (genreData?.items ?? [])
          : (searchData?.items ?? []),
    [activeTerm, activeGenre, searchData?.items, genreData?.items],
  );
  const isPending = activeTerm ? isSearchPending : activeGenre ? isGenrePending : false;
  const error = activeTerm ? searchError : activeGenre ? genreError : null;
  const hasNext = activeTerm ? searchData?.hasNext : activeGenre ? genreData?.hasNext : false;

  useEffect(() => {
    setTerm(q);
  }, [q]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = term.trim();
    if (!clean && !genre) return;

    // Detect if the user pasted a direct Aniwatch/source URL or ID
    const parsed = parseId(clean);
    if (parsed) {
      if (parsed.kind === "episode") {
        navigate({
          to: "/watch/$episodeId",
          params: { episodeId: toEpisodeId(parsed.source, parsed.slug) },
        });
        return;
      }
      if (parsed.kind === "anime") {
        navigate({
          to: "/anime/$animeId",
          params: { animeId: toAnimeId(parsed.source, parsed.slug) },
        });
        return;
      }
    }

    navigate({ to: "/cari", search: { q: clean, page: 1, genre, status } });
  };

  const handleSelectGenre = (genreId: string | null) => {
    navigate({
      to: "/cari",
      search: { q, page: 1, genre: genreId || "", status },
    });
  };

  const handleSelectStatus = (newStatus: string) => {
    navigate({
      to: "/cari",
      search: { q, page: 1, genre, status: newStatus },
    });
  };

  // Filter items by status and genre
  const filteredItems = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return rawItems.filter((anime) => {
      // 1. Status Filter
      const yearNum = anime.year ? parseInt(anime.year, 10) : null;
      const isPastYear = yearNum !== null && yearNum > 1900 && yearNum < currentYear;
      const isCompleted =
        /tamat|complete|finish|selesai|ended/i.test(anime.status ?? "") ||
        (isPastYear && !/ongoing|tayang/i.test(anime.status ?? ""));
      const isOngoing = !isCompleted && /ongoing|tayang/i.test(anime.status ?? "");

      if (status === "ongoing" && !isOngoing) return false;
      if (status === "completed" && !isCompleted) return false;

      // 2. Genre Filter (if searched with term and also filtered by genre)
      if (activeTerm && activeGenre) {
        const matches =
          (anime.genres &&
            anime.genres.some((g) => g.toLowerCase().includes(activeGenre.toLowerCase()))) ||
          anime.title.toLowerCase().includes(activeGenre.toLowerCase());
        if (!matches) return false;
      }

      return true;
    });
  }, [rawItems, status, activeTerm, activeGenre]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-8">
      <SectionTitle title="Cari & Filter Anime" icon={Search} />

      {/* Main Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ketik judul anime (mis. Naruto, Frieren, Solo Leveling)..."
          className="h-11 flex-1 rounded-full border border-border bg-card px-4 text-sm text-card-foreground outline-hidden placeholder:text-muted-foreground focus:border-primary shadow-2xs"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer shadow-xs active:scale-95"
        >
          <Search className="h-4 w-4" />
          <span>Cari</span>
        </button>
      </form>

      {/* Genre Filter Bar & Dropdown Menu */}
      <GenreFilterBar
        activeGenreId={activeGenre || null}
        onSelectGenre={handleSelectGenre}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 hidden sm:inline">
            Status:
          </span>
          {[
            { id: "all", label: "Semua" },
            { id: "ongoing", label: "Ongoing" },
            { id: "completed", label: "Tamat" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => handleSelectStatus(st.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                status === st.id
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Active Filter Clear Tag */}
        {activeGenre || status !== "all" ? (
          <button
            type="button"
            onClick={() =>
              navigate({ to: "/cari", search: { q, page: 1, genre: "", status: "all" } })
            }
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>Reset Filter</span>
          </button>
        ) : null}
      </div>

      {!activeTerm && !activeGenre ? (
        <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
          <Film className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium text-foreground">Mulai Cari atau Pilih Kategori Genre</p>
          <p className="text-xs max-w-sm mx-auto">
            Ketik kata kunci judul anime di atas atau pilih genre seperti Action, Slice of Life,
            atau Fantasy untuk memfilter katalog.
          </p>
        </div>
      ) : null}

      {isPending ? <GridSkeleton count={6} /> : null}
      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            if (activeTerm) refetchSearch();
            else refetchGenre();
          }}
        />
      ) : null}

      {(activeTerm || activeGenre) && !isPending && filteredItems.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>
              Hasil{" "}
              {activeGenre
                ? `Genre "${ALL_GENRE_OPTIONS.find((g) => g.id === activeGenre)?.name || activeGenre}"`
                : ""}{" "}
              {activeTerm ? `Pencarian "${activeTerm}"` : ""} ({filteredItems.length} anime)
            </span>
            {status !== "all" ? (
              <span className="text-primary font-bold capitalize">Status: {status}</span>
            ) : null}
          </div>
          <div className="space-y-2">
            {filteredItems.map((anime) => (
              <AnimeListRow key={anime.id} anime={anime} />
            ))}
          </div>
          <Pagination
            page={page}
            hasNext={Boolean(hasNext)}
            onChange={(next) => navigate({ to: "/cari", search: { q, page: next, genre, status } })}
          />
        </div>
      ) : null}

      {(activeTerm || activeGenre) && !isPending && filteredItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Tidak Ditemukan Anime yang Cocok</p>
          <p className="text-xs">
            {activeTerm
              ? `Tidak ditemukan anime dengan kata kunci "${activeTerm}" ${activeGenre ? `pada genre "${activeGenre}"` : ""}.`
              : `Belum ada anime untuk kombinasi filter ini.`}
          </p>
        </div>
      ) : null}

      {/* Filter Sidebar Drawer */}
      <SearchFilterPanel open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </div>
  );
}
