import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { SearchFilterPanel } from "./SearchFilterPanel";
import { AnimeGachaModal } from "./AnimeGachaModal";
import { SpotlightSearchModal } from "./SpotlightSearchModal";
import { AuthModal } from "./AuthModal";
import { NotificationsModal } from "./NotificationsModal";
import { readWatchlist } from "@/lib/watchlist";
import { useQuery } from "@tanstack/react-query";
import { searchQuery } from "@/lib/queries";
import { useAuth, signOutUser } from "@/lib/firebase";
import { readGamification, type UserGamification } from "@/lib/gamification";
import { getUnreadUpdatesCount } from "@/lib/notifications";
import {
  Bell,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Dices,
  DownloadCloud,
  Flame,
  History,
  Home,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Play,
  Search,
  SlidersHorizontal,
  Tags,
  Trophy,
  User as UserIcon,
  X,
} from "lucide-react";
import { DownloadManagerModal } from "./DownloadManagerModal";
import { getActiveTasks, getOfflineEpisodes } from "@/lib/download-manager";
import { cn } from "@/lib/utils";

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
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [gamification, setGamification] = useState<UserGamification>(readGamification());
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [activeDownloadsCount, setActiveDownloadsCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    const syncDownloads = async () => {
      try {
        const running = getActiveTasks().filter((t) => t.status === "downloading");
        setActiveDownloadsCount(running.length);
        const saved = await getOfflineEpisodes();
        setOfflineCount(saved.length);
      } catch {
        // no-op
      }
    };
    syncDownloads();
    window.addEventListener("nonton-downloads-updated", syncDownloads);
    const handleOpenDownloads = () => setDownloadModalOpen(true);
    window.addEventListener("open-download-manager", handleOpenDownloads);

    return () => {
      window.removeEventListener("nonton-downloads-updated", syncDownloads);
      window.removeEventListener("open-download-manager", handleOpenDownloads);
    };
  }, []);

  useEffect(() => {
    const updateCount = () => {
      setWatchlistCount(readWatchlist().length);
    };
    updateCount();
    window.addEventListener("watchlist-updated", updateCount);
    return () => window.removeEventListener("watchlist-updated", updateCount);
  }, []);

  useEffect(() => {
    const syncNotifs = () => setUnreadNotifCount(getUnreadUpdatesCount());
    syncNotifs();
    window.addEventListener("site-updates-read-changed", syncNotifs);
    return () => window.removeEventListener("site-updates-read-changed", syncNotifs);
  }, []);

  useEffect(() => {
    const syncGame = () => setGamification(readGamification());
    syncGame();
    window.addEventListener("gamification-updated", syncGame);
    return () => window.removeEventListener("gamification-updated", syncGame);
  }, []);

  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setAuthModalTab(detail?.mode === "register" ? "register" : "login");
      setAuthModalOpen(true);
    };
    window.addEventListener("open-auth-modal", handleOpenAuth);
    return () => window.removeEventListener("open-auth-modal", handleOpenAuth);
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

  // Keyboard shortcut Ctrl+K or Cmd+K to open Spotlight Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && document.activeElement?.tagName !== "INPUT")
      ) {
        e.preventDefault();
        setShowSpotlight(true);
      } else if (e.key === "Escape") {
        setShowSearchDropdown(false);
        setShowFilterPanel(false);
        setShowSpotlight(false);
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
                nonton<span className="text-primary font-bold">ime</span>
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

            {/* Spotlight Search Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setShowSpotlight(true)}
              title="Cari Cepat & Navigasi (Ctrl+K / ⌘K)"
              className="hidden xl:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:text-primary hover:border-primary/50 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>Cepat</span>
              <kbd className="rounded border border-border/60 bg-muted/60 px-1 py-0.2 text-[9px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Filter & Discover Quick Button */}
            <button
              type="button"
              onClick={() => setShowFilterPanel(true)}
              title="Panel Filter Kategori Genre, Tahun, & Status"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/40 px-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:text-primary hover:border-primary/50 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span className="hidden lg:inline">Filter</span>
            </button>

            {/* Random / Gacha Roulette Button */}
            <button
              type="button"
              onClick={() => setShowGachaModal(true)}
              title="Acak Anime / Mau Nonton Apa?"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/20 hover:scale-102 active:scale-95 cursor-pointer"
            >
              <Dices className="h-4 w-4" />
              <span className="hidden md:inline">Acak</span>
            </button>

            {/* Mobile Search Button -> opens Spotlight */}
            <button
              type="button"
              onClick={() => setShowSpotlight(true)}
              aria-label="Cari anime instan (Spotlight)"
              title="Cari cepat (⌘K)"
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

            {/* Download Manager Quick Button */}
            <button
              type="button"
              id="header-downloads-btn"
              onClick={() => setDownloadModalOpen(true)}
              title="Download Manager & Koleksi Offline"
              aria-label="Download Manager"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-secondary/40 text-foreground transition-colors hover:bg-secondary cursor-pointer"
            >
              <DownloadCloud
                className={cn(
                  "h-4 w-4",
                  activeDownloadsCount > 0 ? "text-primary animate-bounce" : "text-foreground",
                )}
              />
              {activeDownloadsCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground shadow-xs animate-pulse">
                  {activeDownloadsCount}
                </span>
              ) : offlineCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/90 px-1 text-[8px] font-bold text-white shadow-xs">
                  {offlineCount}
                </span>
              ) : null}
            </button>

            {/* Notification Bell Button */}
            <button
              type="button"
              id="header-notifications-btn"
              onClick={() => setNotificationsModalOpen(true)}
              title="Pusat Notifikasi & Update Website"
              aria-label="Notifikasi dan Pembaruan"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-secondary/40 text-foreground transition-colors hover:bg-secondary cursor-pointer"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground shadow-xs animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Authentication / User Profile with Level & Rank */}
            {user ? (
              <Link
                to="/profil"
                id="header-user-profile-btn"
                title={`Profil: ${user.displayName || user.email} (Lv.${gamification.level} ${gamification.rankTitle})`}
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 p-1 pr-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <div className="relative">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-black text-primary-foreground shadow-xs">
                    Lv.{gamification.level}
                  </span>
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="max-w-[90px] truncate text-[11px] font-bold text-foreground">
                    {user.displayName?.split(" ")[0] || "Profil"}
                  </span>
                  <span className="text-[9px] text-primary font-semibold truncate max-w-[90px]">
                    {gamification.rankTitle}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab("login");
                    setAuthModalOpen(true);
                  }}
                  title="Masuk ke akun Nontonime"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:border-primary/50 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-primary" />
                  <span>Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab("register");
                    setAuthModalOpen(true);
                  }}
                  title="Daftar akun baru dan dapatkan +100 EXP"
                  className="hidden md:inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 cursor-pointer"
                >
                  <span>Daftar</span>
                  <span className="rounded-full bg-primary-foreground/20 px-1 text-[9px] font-black">
                    +100 EXP
                  </span>
                </button>
              </div>
            )}

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

              {/* Mobile Notification & Updates shortcut */}
              <div className="border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setNotificationsModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span>Pusat Notifikasi & Update</span>
                  </div>
                  {unreadNotifCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
                      {unreadNotifCount} Baru
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile Account Section */}
              <div className="border-t border-border/60 pt-3">
                {user ? (
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/40 p-3">
                    <Link
                      to="/profil"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 min-w-0"
                    >
                      <div className="relative shrink-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            className="h-9 w-9 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 flex h-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-black text-primary-foreground shadow-xs">
                          Lv.{gamification.level}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">
                            {user.displayName || "Pengguna"}
                          </p>
                          <span className="text-[10px] text-primary font-bold">
                            {gamification.rankTitle}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOutUser()}
                      title="Keluar"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setAuthModalTab("login");
                        setAuthModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background p-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 text-primary" />
                      <span>Masuk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setAuthModalTab("register");
                        setAuthModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl bg-primary p-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 cursor-pointer"
                    >
                      <span>Daftar Akun</span>
                      <span className="rounded-full bg-primary-foreground/20 px-1 text-[9px] font-black">
                        +100 EXP
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Overlay Search & Filter Drawer Panel */}
      <SearchFilterPanel isOpen={showFilterPanel} onClose={() => setShowFilterPanel(false)} />

      {/* Anime Gacha Roulette Modal */}
      <AnimeGachaModal open={showGachaModal} onOpenChange={setShowGachaModal} />

      {/* Spotlight Command Palette Search Modal (⌘K) */}
      <SpotlightSearchModal
        open={showSpotlight}
        onOpenChange={setShowSpotlight}
        onOpenGacha={() => setShowGachaModal(true)}
      />

      {/* Auth Modal (Email & Google login / Register) */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} initialTab={authModalTab} />

      {/* Notifications & Site Updates Modal */}
      <NotificationsModal open={notificationsModalOpen} onOpenChange={setNotificationsModalOpen} />

      {/* Download Manager & Offline Library Modal */}
      <DownloadManagerModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </>
  );
}
