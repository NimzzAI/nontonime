import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { readWatchlist } from "@/lib/watchlist";
import { cn } from "@/lib/utils";

// Custom SVG Icons crafted specifically for Nontonime modern mobile interface
function CustomHomeIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M3 10.5L12 3l9 7.5v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.22 : 0}
      />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function CustomFlameIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M12 2c1 3.5 5 5.5 5 10a7 7 0 1 1-14 0c0-4.5 3.5-6.5 4.5-9.5 2 2.5 4.5 2 4.5-.5z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.22 : 0}
      />
      <path
        d="M12 18a3 3 0 0 0 3-3c0-1.8-1.2-2.8-2-3.8-.4.8-1.2 1.2-1.6.8-.8-.8 0-2.4.8-3.6-2.8 1.2-4 4-2.8 6.4.5 1.2 1.4 2.2 2.6 2.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function CustomCalendarIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="3"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.22 : 0}
      />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="8" cy="14.5" r="1" fill="currentColor" />
      <circle cx="12" cy="14.5" r="1" fill="currentColor" />
      <circle cx="16" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}

function CustomBookmarkIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.25 : 0}
      />
      <path d="M12 7v4" strokeLinecap="round" />
      <path d="M10 9h4" strokeLinecap="round" />
    </svg>
  );
}

function CustomHistoryIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.22 : 0}
      />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

interface TabItem {
  to: string;
  label: string;
  exact: boolean;
  search?: Record<string, unknown>;
  badge?: boolean;
  IconComponent: React.ComponentType<{ active?: boolean; className?: string }>;
}

const TABS: readonly TabItem[] = [
  {
    to: "/",
    label: "Beranda",
    exact: true,
    IconComponent: CustomHomeIcon,
  },
  {
    to: "/ongoing",
    label: "Ongoing",
    exact: false,
    search: { page: 1 },
    IconComponent: CustomFlameIcon,
  },
  {
    to: "/jadwal",
    label: "Jadwal",
    exact: false,
    IconComponent: CustomCalendarIcon,
  },
  {
    to: "/watchlist",
    label: "Watchlist",
    exact: false,
    badge: true,
    IconComponent: CustomBookmarkIcon,
  },
  {
    to: "/riwayat",
    label: "Riwayat",
    exact: false,
    IconComponent: CustomHistoryIcon,
  },
];

export function BottomNav() {
  const [watchlistCount, setWatchlistCount] = useState(0);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

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
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      {/* Blurred glass-morphism container */}
      <div className="relative mx-auto w-full pointer-events-auto border-t border-white/15 dark:border-white/10 bg-background/80 dark:bg-card/75 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.25)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent">
        <div className="flex h-16 w-full items-center justify-around px-2">
          {TABS.map((tab) => {
            const isActive = tab.exact ? currentPath === tab.to : currentPath.startsWith(tab.to);
            const Icon = tab.IconComponent;

            return (
              <Link
                key={tab.to}
                to={tab.to}
                search={tab.search as never}
                activeOptions={{ exact: tab.exact }}
                className="group relative flex flex-1 flex-col items-center justify-center py-1 select-none"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <div
                    className={cn(
                      "relative flex h-8 w-13 items-center justify-center rounded-full transition-all duration-200",
                      isActive
                        ? "text-primary font-bold"
                        : "text-muted-foreground group-hover:text-foreground group-hover:bg-secondary/40",
                    )}
                  >
                    {/* Active Pill Glow with Spring Motion */}
                    {isActive ? (
                      <motion.div
                        layoutId="bottom-nav-active-pill"
                        className="absolute inset-0 rounded-full bg-primary/15 border border-primary/25 shadow-xs"
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      />
                    ) : null}

                    {/* Custom SVG Icon */}
                    <Icon
                      active={isActive}
                      className={cn(
                        "relative z-10 h-5 w-5 transition-transform duration-200",
                        isActive ? "scale-110" : "group-hover:scale-105",
                      )}
                    />

                    {/* Watchlist Counter Badge */}
                    {tab.badge && watchlistCount > 0 ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 right-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-primary-foreground shadow-xs shadow-primary/40"
                      >
                        {watchlistCount > 99 ? "99+" : watchlistCount}
                      </motion.span>
                    ) : null}
                  </div>

                  <span
                    className={cn(
                      "text-[10px] leading-tight tracking-tight mt-0.5 transition-colors font-medium",
                      isActive ? "text-primary font-bold" : "text-muted-foreground",
                    )}
                  >
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
