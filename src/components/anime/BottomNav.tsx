import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readWatchlist } from "@/lib/watchlist";
import { Bookmark, CalendarDays, Flame, History, Home } from "lucide-react";

interface TabItem {
  to: string;
  label: string;
  icon: typeof Home;
  exact: boolean;
  search?: Record<string, unknown>;
  badge?: boolean;
}

const TABS: readonly TabItem[] = [
  { to: "/", label: "Beranda", icon: Home, exact: true },
  {
    to: "/ongoing",
    label: "Ongoing",
    icon: Flame,
    exact: false,
    search: { page: 1 },
  },
  {
    to: "/jadwal",
    label: "Jadwal",
    icon: CalendarDays,
    exact: false,
  },
  {
    to: "/watchlist",
    label: "Watchlist",
    icon: Bookmark,
    exact: false,
    badge: true,
  },
  {
    to: "/riwayat",
    label: "Riwayat",
    icon: History,
    exact: false,
  },
];

export function BottomNav() {
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const update = () => setWatchlistCount(readWatchlist().length);
    update();
    window.addEventListener("watchlist-updated", update);
    return () => window.removeEventListener("watchlist-updated", update);
  }, []);

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navigasi Bawah"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center border-t border-border/80 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex w-full items-center justify-around px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              search={tab.search as never}
              activeOptions={{ exact: tab.exact }}
              activeProps={{
                className: "text-primary font-semibold [&_.nav-icon-wrapper]:bg-primary/10",
              }}
              className="group relative flex flex-1 flex-col items-center justify-center py-1 text-muted-foreground transition-all duration-150 active:scale-95"
            >
              <div className="nav-icon-wrapper relative flex h-8 w-12 items-center justify-center rounded-full transition-colors group-hover:bg-secondary">
                <Icon className="h-5 w-5 transition-transform group-hover:scale-105" />
                {tab.badge && watchlistCount > 0 ? (
                  <span className="absolute -top-0.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                    {watchlistCount > 99 ? "99+" : watchlistCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] leading-tight tracking-tight mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
