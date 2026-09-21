import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { SearchFilterPanel } from "./SearchFilterPanel";
import { readWatchlist } from "@/lib/watchlist";
import { useQuery } from "@tanstack/react-query";
import { searchQuery } from "@/lib/queries";
import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Flame,
  History,
  Home,
  Loader2,
  Menu,
  Play,
  Search,
  SlidersHorizontal,
  Tags,
  X,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  search?: Record<string, unknown>;
}

const NAV_MAIN: readonly NavItem[] = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/ongoing", label: "Ongoing", icon: Flame, search: { page: 1 } },
  { to: "/tamat", label: "Tamat", icon: CheckCircle2, search: { page: 1 } },
  { to: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/genre", label: "Genre", icon: Tags },
];

const NAV_SECONDARY: readonly NavItem[] = [
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/riwayat", label: "Riwayat", icon: History },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateCount = () => {
      setWatchlistCount(readWatchlist().length);
    };
    updateCount();
    window.addEventListener("watchlist-updated", updateCount);
    return () => window.removeEventListener("watchlist-updated", updateCount);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchData, isFetching } = useQuery(searchQuery(debouncedTerm));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or / to open Search & Filter Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && document.activeElement?.tagName !== "INPUT")
      ) {
        e.preventDefault();
        setShowFilterPanel(true);
      } else if (e.key === "Escape") {
        setShowSearchDropdown(false);
        setShowFilterPanel(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setShowSearchDropdown(false);
    navigate({
      to: "/cari",
      search: { q: searchTerm.trim(), page: 1 },
    });
  };

  return (
    <>
      {open ? (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      ) : null}

      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left: Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              id="site-logo"
              className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </div>
              <span className="flex items-center tracking-tight text-base font-extrabold sm:text-lg">
                Nonton<span className="text-primary ml-0.5">ime</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav id="desktop-main-nav" className="hidden lg:flex items-center gap-1">
              {NAV_MAIN.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    search={("search" in item ? item.search : {}) as never}
                    activeProps={{
                      className: "text-foreground font-semibold bg-secondary/80",
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 opacity-70" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center/Right: Search Bar & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Instant Search Bar */}
            <div ref={searchContainerRef} className="relative hidden md:block w-64 lg:w-76">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  id="site-search-input"
                  type="text"
                  placeholder="Cari anime..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="h-9 w-full rounded-lg border border-border/80 bg-secondary/40 pl-8.5 pr-14 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:bg-background focus:border-primary/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-sm"
                    aria-label="Hapus kata kunci"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                    /
                  </kbd>
                )}
              </form>

              {/* Instant Search Dropdown Popover */}
              {showSearchDropdown && debouncedTerm ? (
                <div className="absolute right-0 top-11 z-50 w-84 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-xl">
                  <div className="flex items-center justify-between border-b border-border/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span>Hasil Pencarian</span>
                    {isFetching ? (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {searchData?.items?.length ?? 0} ditemukan
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-1 py-1">
                    {searchData?.items && searchData.items.length > 0 ? (
                      searchData.items.slice(0, 6).map((item) => (
                        <Link
                          key={item.id}
                          to="/anime/$animeId"
                          params={{ animeId: item.id }}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/70"
                        >
                          <img
                            src={item.poster ?? ""}
                            alt={item.title}
                            className="h-12 w-9 rounded-sm object-cover bg-muted shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-xs font-semibold text-foreground">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              {item.score ? (
                                <span className="font-semibold text-amber-500">★ {item.score}</span>
                              ) : null}
                              <span className="truncate">{item.status || "Sub Indo"}</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : !isFetching ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        Tidak ada anime yang cocok dengan &quot;{debouncedTerm}&quot;
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="block w-full border-t border-border/60 pt-2 pb-1 text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Lihat Semua Hasil Pencarian →
                  </button>
                </div>
              ) : null}
            </div>

            {/* Filter & Discover Quick Button */}
            <button
              type="button"
              onClick={() => setShowFilterPanel(true)}
              title="Panel Filter Kategori Genre, Tahun, & Status (Ctrl+K)"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:text-primary hover:border-primary/50 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span className="hidden lg:inline">Filter</span>
            </button>

            {/* Mobile Search & Filter Button */}
            <button
              type="button"
              onClick={() => setShowFilterPanel(true)}
              aria-label="Cari dan filter anime"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-secondary/40 text-foreground transition-colors hover:bg-secondary md:hidden cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Watchlist Quick Button with Counter */}
            <Link
              to="/watchlist"
              id="header-watchlist-btn"
              aria-label="Daftar tontonan"
              className="relative inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              title="Watchlist tersimpan"
            >
              <Bookmark className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Watchlist</span>
              {watchlistCount > 0 ? (
                <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {watchlistCount > 99 ? "99+" : watchlistCount}
                </span>
              ) : null}
            </Link>

            {/* History Link (Desktop/Tablet) */}
            <Link
              to="/riwayat"
              id="header-history-btn"
              aria-label="Riwayat nonton"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              title="Riwayat tontonan"
            >
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="hidden md:inline">Riwayat</span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Hamburger */}
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setOpen((val) => !val)}
              aria-label="Menu navigasi"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-secondary/40 text-foreground transition-colors hover:bg-secondary lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open ? (
          <div
            id="mobile-navigation-drawer"
            className="border-t border-border bg-card/98 px-4 py-4 backdrop-blur-md lg:hidden"
          >
            <div className="space-y-4">
              {/* Mobile Menu Search */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari anime favorit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-hidden"
                />
              </form>

              {/* Main Categories Section */}
              <div>
                <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Jelajahi
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {NAV_MAIN.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        search={("search" in item ? item.search : {}) as never}
                        onClick={() => setOpen(false)}
                        activeProps={{
                          className: "border-primary/40 bg-primary/10 text-primary font-semibold",
                        }}
                        className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* User Collections Section */}
              <div>
                <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Koleksi Saya
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {NAV_SECONDARY.map((item) => {
                    const Icon = item.icon;
                    const isWatchlist = item.to === "/watchlist";
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        activeProps={{
                          className: "border-primary/40 bg-primary/10 text-primary font-semibold",
                        }}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isWatchlist && watchlistCount > 0 ? (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                            {watchlistCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Overlay Search & Filter Drawer Panel */}
      <SearchFilterPanel isOpen={showFilterPanel} onClose={() => setShowFilterPanel(false)} />
    </>
  );
}
