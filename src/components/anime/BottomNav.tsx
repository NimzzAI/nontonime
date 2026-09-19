import { Link } from "@tanstack/react-router";

const TABS = [
  { to: "/", label: "Home", icon: "fa-solid fa-house", exact: true, search: undefined },
  { to: "/jadwal", label: "Jadwal", icon: "fa-solid fa-calendar-days", exact: false, search: undefined },
  { to: "/cari", label: "Cari", icon: "fa-solid fa-magnifying-glass", exact: false, search: { q: "", page: 1 } },
  { to: "/riwayat", label: "Riwayat", icon: "fa-solid fa-clock-rotate-left", exact: false, search: undefined },
  { to: "/profil", label: "Profil", icon: "fa-solid fa-circle-user", exact: false, search: undefined },
] as const;

export function BottomNav() {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          search={tab.search as never}
          activeOptions={{ exact: tab.exact }}
          activeProps={{ className: "text-primary" }}
          className="press-soft flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors"
        >
          <i className={`${tab.icon} text-lg`} />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
