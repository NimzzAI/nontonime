import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  Bookmark,
  History,
  Film,
  Dices,
  Flame,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { searchQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface SpotlightSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenGacha?: () => void;
}

const TRENDING_KEYWORDS = [
  "One Piece",
  "Mushoku Tensei",
  "Solo Leveling",
  "Chainsaw Man",
  "Bleach",
  "Oshi no Ko",
  "Jujutsu Kaisen",
  "Wind Breaker",
];

const RECENT_SEARCHES_KEY = "nonton-recent-searches";

export function SpotlightSearchModal({
  open,
  onOpenChange,
  onOpenGacha,
}: SpotlightSearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        setRecentSearches(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, [open]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [
      clean,
      ...recentSearches.filter((t) => t.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
      setSelectedIndex(-1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setSearchTerm("");
      setDebouncedTerm("");
      setSelectedIndex(-1);
    }
  }, [open]);

  // Fetch search query
  const { data: searchResults, isFetching } = useQuery({
    ...searchQuery(debouncedTerm),
    enabled: Boolean(debouncedTerm && debouncedTerm.length >= 2),
  });

  const items = searchResults?.items || [];

  const handleSelectAnime = (animeId: string, title?: string) => {
    if (title) saveRecentSearch(title);
    onOpenChange(false);
    navigate({ to: "/anime/$animeId", params: { animeId } });
  };

  const handleFullSearch = (query: string) => {
    if (!query.trim()) return;
    saveRecentSearch(query);
    onOpenChange(false);
    navigate({ to: "/cari", search: { q: query.trim() } });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleSelectAnime(items[selectedIndex].id, items[selectedIndex].title);
      } else if (searchTerm.trim()) {
        handleFullSearch(searchTerm);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        {/* Search Header Input */}
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari judul anime, karakter, atau genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="hidden sm:inline-flex items-center gap-1 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground"
          >
            ESC
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* If there are search results */}
          {debouncedTerm && debouncedTerm.length >= 2 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Hasil Pencarian ({items.length})
                </span>
                {items.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleFullSearch(debouncedTerm)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Buka Halaman Cari Lengkap
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              {items.length > 0 ? (
                <div className="space-y-1.5">
                  {items.slice(0, 8).map((anime, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={anime.id}
                        onClick={() => handleSelectAnime(anime.id, anime.title)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-all border",
                          isSelected
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-transparent bg-secondary/30 hover:bg-secondary/70 text-foreground/90",
                        )}
                      >
                        <img
                          src={anime.poster || ""}
                          alt={anime.title}
                          className="h-14 w-10 rounded-lg object-cover bg-muted shrink-0 shadow-xs"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="line-clamp-1 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {anime.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            {anime.score ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                ★ {anime.score}
                              </span>
                            ) : null}
                            <span className="rounded bg-background/80 px-1.5 py-0.5 border border-border/60 text-[10px] font-medium">
                              {anime.status || "Sub Indo"}
                            </span>
                            {anime.type ? (
                              <span className="text-[10px] opacity-80">{anime.type}</span>
                            ) : null}
                          </div>
                        </div>
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform",
                            isSelected
                              ? "text-primary translate-x-0.5"
                              : "text-muted-foreground opacity-40",
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : !isFetching ? (
                <div className="rounded-xl border border-dashed border-border/80 py-8 text-center">
                  <Film className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Tidak ditemukan anime dengan kata kunci &quot;{debouncedTerm}&quot;
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Coba gunakan kata kunci yang lebih singkat atau judul bahasa Inggris.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            /* Default view: Trending, Quick Nav, Recent Searches */
            <div className="space-y-4">
              {/* Quick Navigation Shortcuts */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  Pintasan Cepat
                </span>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/jadwal" });
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-2.5 text-left hover:bg-accent transition-all group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Jadwal Rilis</p>
                      <p className="text-[10px] text-muted-foreground">Update mingguan</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/ongoing" });
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-2.5 text-left hover:bg-accent transition-all group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                      <Flame className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Ongoing</p>
                      <p className="text-[10px] text-muted-foreground">Sedang tayang</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/tamat" });
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-2.5 text-left hover:bg-accent transition-all group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-105 transition-transform">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Anime Tamat</p>
                      <p className="text-[10px] text-muted-foreground">Binge-watch</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      if (onOpenGacha) {
                        onOpenGacha();
                      } else {
                        navigate({ to: "/" });
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-2.5 text-left hover:bg-accent transition-all group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Dices className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Gacha Acak</p>
                      <p className="text-[10px] text-muted-foreground">Putar roda anime</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Trending Anime Keywords */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span>Paling Sering Dicari</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TRENDING_KEYWORDS.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => {
                        setSearchTerm(keyword);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/15 hover:border-primary/50 transition-colors"
                    >
                      <Flame className="h-3 w-3 text-amber-500" />
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <History className="h-3.5 w-3.5 text-primary" />
                      <span>Pencarian Terakhir</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                    >
                      Hapus Riwayat
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {recentSearches.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => {
                          setSearchTerm(keyword);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Clock className="h-3 w-3" />
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[9px]">
                ↑↓
              </kbd>{" "}
              navigasi
            </span>
            <span>
              <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[9px]">
                ↵
              </kbd>{" "}
              buka
            </span>
          </div>
          <span className="font-semibold text-primary">nontonime</span>
        </div>
      </div>
    </div>
  );
}
