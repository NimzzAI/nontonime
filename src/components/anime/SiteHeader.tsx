import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { readWatchlist } from "@/lib/watchlist";
import { useQuery } from "@tanstack/react-query";
import { searchQuery } from "@/lib/queries";

const NAV = [
  { to: "/", label: "Beranda", icon: "fa-solid fa-house" },
  { to: "/ongoing", label: "Ongoing", icon: "fa-solid fa-tower-broadcast", search: { page: 1 } },
  { to: "/tamat", label: "Tamat", icon: "fa-solid fa-circle-check", search: { page: 1 } },
  { to: "/jadwal", label: "Jadwal", icon: "fa-solid fa-calendar-days" },
  { to: "/genre", label: "Genre", icon: "fa-solid fa-tags" },
  { to: "/watchlist", label: "Watchlist", icon: "fa-solid fa-bookmark" },
  { to: "/riwayat", label: "Riwayat", icon: "fa-solid fa-clock-rotate-left" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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
    }, 300);
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      ) : null}

      <header className="glass sticky top-0 z-50 border-b border-border/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-display text-lg font-black tracking-tight text-foreground transition-transform hover:scale-102"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-rose-500 text-white shadow-md shadow-primary/30">
              <i className="fa-solid fa-play text-sm ml-0.5" />
            </div>
            <span className="flex items-center">
              Nonton<span className="text-primary">ime</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="ml-4 hidden items-center gap-1 xl:gap-2 lg:flex">
            {NAV.slice(0, 5).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={("search" in item ? item.search : {}) as never}
                activeProps={{
                  className: "bg-primary/15 text-primary font-semibold border-primary/30",
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-95"
              >
                <i className={`${item.icon} text-xs opacity-75`} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Instant Search Bar */}
          <div ref={searchContainerRef} className="relative ml-auto hidden md:block w-64 lg:w-80">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Cari anime subtitle Indonesia..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="h-10 w-full rounded-full border border-border/80 bg-card/90 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground shadow-xs transition-all focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <i className="fa-solid fa-circle-xmark text-xs" />
                </button>
              ) : null}
            </form>

            {/* Instant Search Dropdown Popover */}
            {showSearchDropdown && debouncedTerm ? (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  <span>Hasil Pencarian</span>
                  {isFetching ? (
                    <i className="fa-solid fa-circle-notch animate-spin text-primary" />
                  ) : null}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1 py-1">
                  {searchData?.items && searchData.items.length > 0 ? (
                    searchData.items.slice(0, 6).map((item) => (
                      <Link
                        key={item.id}
                        to="/anime/$animeId"
                        params={{ animeId: item.id }}
                        onClick={() => setShowSearchDropdown(false)}
                        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent"
                      >
                        <img
                          src={item.poster ?? ""}
                          alt={item.title}
                          className="h-12 w-9 rounded-md object-cover bg-muted shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-semibold text-foreground">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {item.score ? (
                              <span className="text-amber-400 font-bold">★ {item.score}</span>
                            ) : null}
                            <span>{item.status || "Sub Indo"}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : !isFetching ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Tidak ada anime yang cocok.
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={handleSearchSubmit}
                  className="block w-full border-t border-border/60 py-2 text-center text-xs font-bold text-primary hover:bg-accent rounded-b-xl"
                >
                  Lihat Semua Hasil
                </button>
              </div>
            ) : null}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Link
              to="/cari"
              search={{ q: "", page: 1 }}
              aria-label="Cari anime"
              className="press-soft inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-card-foreground transition-colors hover:bg-accent md:hidden"
            >
              <i className="fa-solid fa-magnifying-glass text-xs" />
            </Link>

            {/* Watchlist Quick Button with Counter */}
            <Link
              to="/watchlist"
              aria-label="Daftar tontonan"
              className="press-soft relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-card-foreground transition-colors hover:bg-accent"
              title="Watchlist tersimpan"
            >
              <i className="fa-solid fa-bookmark text-xs text-primary" />
              {watchlistCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                  {watchlistCount > 99 ? "99+" : watchlistCount}
                </span>
              ) : null}
            </Link>

            {/* History Link */}
            <Link
              to="/riwayat"
              aria-label="Riwayat nonton"
              className="press-soft hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-card-foreground transition-colors hover:bg-accent"
              title="Riwayat tontonan"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs text-muted-foreground" />
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Drawer Hamburger */}
            <button
              onClick={() => setOpen((value) => !value)}
              aria-label="Menu navigasi"
              className="press-soft inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-card-foreground transition-colors hover:bg-accent lg:hidden"
            >
              <i className={open ? "fa-solid fa-xmark" : "fa-solid fa-bars"} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open ? (
          <div className="border-t border-border bg-card/95 px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  search={("search" in item ? item.search : {}) as never}
                  onClick={() => setOpen(false)}
                  className="press-soft flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/50 p-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <i className={`${item.icon} text-sm text-primary`} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
