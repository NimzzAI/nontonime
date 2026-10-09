import { useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Check,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type GenreOption, ALL_GENRE_OPTIONS } from "@/lib/anime-types";

export type { GenreOption };
export { ALL_GENRE_OPTIONS };

// Highlighted quick pills requested by user
const FEATURED_PILLS = [
  { id: "action", name: "Action" },
  { id: "slice-of-life", name: "Slice of Life" },
  { id: "fantasy", name: "Fantasy" },
  { id: "isekai", name: "Isekai" },
  { id: "romance", name: "Romance" },
  { id: "comedy", name: "Comedy" },
  { id: "adventure", name: "Adventure" },
];

export function GenreFilterBar({
  activeGenreId,
  onSelectGenre,
  onOpenSidebar,
  className,
}: {
  activeGenreId?: string | null;
  onSelectGenre?: (genreId: string | null) => void;
  onOpenSidebar?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return ALL_GENRE_OPTIONS;
    const q = searchQuery.toLowerCase().trim();
    return ALL_GENRE_OPTIONS.filter((g) => g.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const activeGenre = ALL_GENRE_OPTIONS.find((g) => g.id === activeGenreId);

  const handleGenreClick = (genre: GenreOption) => {
    setDropdownOpen(false);
    if (onSelectGenre) {
      onSelectGenre(genre.id === activeGenreId ? null : genre.id);
    } else {
      navigate({
        to: "/genre/$genreId",
        params: { genreId: genre.id },
        search: { page: 1, name: genre.name },
      });
    }
  };

  const handleClearGenre = () => {
    setDropdownOpen(false);
    if (onSelectGenre) {
      onSelectGenre(null);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/95 p-3 sm:p-4 shadow-xs backdrop-blur-xs space-y-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Section Header & Dropdown Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-foreground">
              Filter Koleksi Anime
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Pilih genre atau buka sidebar filter multi-kategori
            </p>
          </div>
        </div>

        {/* Action Controls: Genre Dropdown Menu & Sidebar Trigger */}
        <div className="flex items-center gap-2">
          {/* Genre Dropdown Menu */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all shadow-2xs cursor-pointer",
                  activeGenre
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border-border/80 bg-secondary/60 text-foreground hover:bg-secondary hover:border-primary/50",
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{activeGenre ? `Genre: ${activeGenre.name}` : "Pilih Dropdown Genre"}</span>
                <ChevronDown className="h-3 w-3 opacity-80" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 max-h-[380px] overflow-y-auto rounded-xl p-2 z-50 border border-border shadow-xl bg-popover text-popover-foreground"
            >
              <div className="px-2 py-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full rounded-lg border border-border bg-secondary/50 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1">
                Koleksi Genre Populer
              </DropdownMenuLabel>

              {activeGenreId ? (
                <DropdownMenuItem
                  onClick={handleClearGenre}
                  className="cursor-pointer text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1.5"
                >
                  Reset Pilihan Genre
                </DropdownMenuItem>
              ) : null}

              <div className="space-y-0.5">
                {filteredGenres.map((g) => {
                  const isSelected = activeGenreId === g.id;
                  return (
                    <DropdownMenuItem
                      key={g.id}
                      onClick={() => handleGenreClick(g)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground hover:bg-secondary hover:text-primary",
                      )}
                    >
                      <span>{g.name}</span>
                      {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </div>

              <DropdownMenuSeparator />

              <div className="p-1">
                <Link
                  to="/genre"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-between w-full rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-secondary transition-colors"
                >
                  <span>Lihat Semua 30+ Genre</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtering Sidebar Button */}
          {onOpenSidebar ? (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground shadow-2xs active:scale-95 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Sidebar Filter</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Quick Clickable Genre Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-1">
        <span className="text-[11px] font-bold text-muted-foreground shrink-0 mr-1 hidden sm:inline">
          Genre Cepat:
        </span>
        {FEATURED_PILLS.map((pill) => {
          const isSelected = activeGenreId === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleGenreClick(pill)}
              className={cn(
                "inline-flex h-7.5 shrink-0 items-center rounded-lg border px-2.5 text-xs font-semibold transition-all active:scale-95 shadow-2xs cursor-pointer",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/80 bg-secondary/50 text-foreground hover:border-primary/60 hover:bg-secondary hover:text-primary",
              )}
            >
              <span>{pill.name}</span>
            </button>
          );
        })}

        <Link
          to="/genre"
          className="inline-flex h-7.5 shrink-0 items-center rounded-lg border border-dashed border-border bg-secondary/30 px-2.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <span>Lainnya...</span>
        </Link>
      </div>
    </div>
  );
}
