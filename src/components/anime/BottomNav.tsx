import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readWatchlist } from "@/lib/watchlist";

const TABS = [
  { to: "/", label: "Beranda", icon: "fa-solid fa-house", exact: true, search: undefined },
  {
    to: "/ongoing",
    label: "Ongoing",
    icon: "fa-solid fa-tower-broadcast",
    exact: false,
    search: { page: 1 },
  },
  {
    to: "/jadwal",
    label: "Jadwal",
    icon: "fa-solid fa-calendar-days",
    exact: false,
    search: undefined,
  },
  {
    to: "/watchlist",
    label: "Watchlist",
    icon: "fa-solid fa-bookmark",
    exact: false,
    search: undefined,
    badge: true,
  },
  {
    to: "/riwayat",
    label: "Riwayat",
    icon: "fa-solid fa-clock-rotate-left",
    exact: false,
    search: undefined,
  },
] as const;

export function BottomNav() {
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const update = () => setWatchlistCount(readWatchlist().length);
    update();
    window.addEventListener("watchlist-updated", update);
    return () => window.removeEventListener("watchlist-updated", update);
  }, []);

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-border/80 bg-background/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden shadow-lg">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          search={tab.search as never}
          activeOptions={{ exact: tab.exact }}
          activeProps={{ className: "text-primary font-bold" }}
          className="press-soft relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <div className="relative">
            <i className={`${tab.icon} text-base`} />
            {"badge" in tab && tab.badge && watchlistCount > 0 ? (
              <span className="absolute -right-2 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-extrabold text-primary-foreground">
                {watchlistCount > 9 ? "9+" : watchlistCount}
              </span>
            ) : null}
          </div>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
