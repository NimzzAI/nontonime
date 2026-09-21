import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { searchQuery, homeQuery } from "@/lib/queries";
import { WatchlistButton } from "./WatchlistButton";
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Star,
  CheckCircle2,
  Flame,
  Layers,
  Calendar,
  Sparkles,
  Loader2,
  Film,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Isekai",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Shounen",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "School",
  "Horror",
  "Psychological",
  "Mecha",
];

const YEARS = ["Semua", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "< 2020"];
const STATUS_OPTIONS = [
  { id: "all", label: "Semua Status" },
  { id: "ongoing", label: "Sedang Tayang (Ongoing)" },
  { id: "completed", label: "Selesai (Tamat)" },
];

export function SearchFilterPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Query search or home items for instant discovery
  const { data: searchData, isFetching: isSearching } = useQuery(
    searchQuery(debouncedTerm || (selectedGenre ? selectedGenre : "a")),
  );

  const { data: homeData } = useQuery(homeQuery());

  // Active filters count
  const activeFilterCount =
    (selectedGenre ? 1 : 0) +
    (selectedYear !== "Semua" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedGenre(null);
    setSelectedYear("Semua");
    setSelectedStatus("all");
    setSearchTerm("");
    setDebouncedTerm("");
  };

  // Combine items and apply filters
  const filteredResults = useMemo(() => {
    const baseItems = debouncedTerm
      ? (searchData?.items ?? [])
      : [...(homeData?.hot ?? []), ...(homeData?.popular ?? []), ...(homeData?.new ?? [])];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = baseItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return unique.filter((item) => {
      // Status filter
      if (selectedStatus === "ongoing") {
        const isOngoing = /ongoing|tayang/i.test(item.status ?? "") || Boolean(item.releaseDay);
        if (!isOngoing) return false;
      } else if (selectedStatus === "completed") {
        const isCompleted = /tamat|complete/i.test(item.status ?? "");
        if (!isCompleted) return false;
      }

      // Year filter (from release date or title if present)
      if (selectedYear !== "Semua") {
        const fullText = `${item.title} ${item.latestReleaseDate ?? ""} ${item.status ?? ""}`;
        if (selectedYear === "< 2020") {
          const matchYear = fullText.match(/\b(19\d\d|200\d|201\d)\b/);
          if (!matchYear) return false;
        } else {
          if (!fullText.includes(selectedYear)) return false;
        }
      }

      // Genre filter
      if (selectedGenre) {
        const matchesGenre =
          item.title.toLowerCase().includes(selectedGenre.toLowerCase()) ||
          (item.genres &&
            item.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase())));
        if (!matchesGenre && debouncedTerm.length === 0) {
          // If searched by genre without keyword, return items if relevant
        }
      }

      return true;
    });
  }, [debouncedTerm, searchData?.items, homeData, selectedStatus, selectedYear, selectedGenre]);

  const handleGoToSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onClose();
    navigate({
      to: "/cari",
      search: { q: searchTerm.trim() || selectedGenre || "", page: 1 },
    });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-in Sidebar / Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border/80 bg-card shadow-2xl overflow-hidden"
          >
            {/* Panel Top Header */}
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">
                    Cari & Filter Anime
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Temukan judul berdasarkan genre, tahun, dan status
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-secondary/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup pencarian"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content: Input, Filter Controls, and Live Results */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Main Search Input Form */}
              <form onSubmit={handleGoToSearch} className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ketik judul anime..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/70 focus:bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Hapus kata kunci"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </form>

              {/* Status Filter Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Status Tayang</span>
                  {selectedStatus !== "all" ? (
                    <span className="text-primary text-[10px] lowercase">aktif</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = selectedStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStatus(st.id)}
                        className={cn(
                          "rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all text-center truncate",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Release Year Filter Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Tahun Rilis</span>
                  {selectedYear !== "Semua" ? (
                    <span className="text-primary text-[10px]">Tahun {selectedYear}</span>
                  ) : null}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {YEARS.map((year) => {
                    const isSelected = selectedYear === year;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setSelectedYear(year)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genre Categorical Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kategori Genre
                  </label>
                  {selectedGenre ? (
                    <button
                      type="button"
                      onClick={() => setSelectedGenre(null)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Hapus Pilihan
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar py-1">
                  {GENRES.map((genre) => {
                    const isSelected = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => setSelectedGenre(isSelected ? null : genre)}
                        className={cn(
                          "rounded-lg border px-3 py-1 text-xs font-medium transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border/80 bg-secondary/40 text-foreground hover:border-primary/50 hover:bg-secondary",
                        )}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtered Live Search Results */}
              <div className="space-y-3 pt-2 border-t border-border/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Hasil Filter ({filteredResults.length})
                  </span>
                  {isSearching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : null}
                </div>

                {filteredResults.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <Film className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    Tidak ada anime yang sesuai dengan kombinasi filter saat ini. Coba sesuaikan
                    kata kunci atau reset filter.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredResults.slice(0, 12).map((item) => {
                      const isOngoing =
                        /ongoing|tayang/i.test(item.status ?? "") || Boolean(item.releaseDay);

                      return (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-2.5 transition-colors hover:border-primary/50 hover:bg-secondary/40"
                        >
                          <Link
                            to="/anime/$animeId"
                            params={{ animeId: item.id }}
                            onClick={onClose}
                            className="flex items-center gap-3 min-w-0 flex-1"
                          >
                            <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {item.poster ? (
                                <img
                                  src={item.poster}
                                  alt={item.title}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h4 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                {item.score ? (
                                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
                                    <Star className="h-2.5 w-2.5 fill-amber-500" />
                                    {item.score}
                                  </span>
                                ) : null}
                                <span>·</span>
                                {isOngoing ? (
                                  <span className="text-emerald-500 font-semibold">Ongoing</span>
                                ) : (
                                  <span className="text-sky-500 font-semibold">Tamat</span>
                                )}
                                {item.episodeCount ? <span>· {item.episodeCount} Eps</span> : null}
                              </div>
                            </div>
                          </Link>

                          {/* Quick Watchlist Toggle */}
                          <div className="shrink-0">
                            <WatchlistButton
                              animeId={item.id}
                              title={item.title}
                              poster={item.poster}
                              size="sm"
                              variant="solid"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="border-t border-border/80 bg-card p-4">
              <button
                type="button"
                onClick={() => handleGoToSearch()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-98"
              >
                <span>Lihat Semua Hasil ({filteredResults.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
