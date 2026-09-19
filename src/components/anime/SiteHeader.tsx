import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/", label: "Beranda", icon: "fa-solid fa-house" },
  { to: "/ongoing", label: "Ongoing", icon: "fa-solid fa-tower-broadcast", search: { page: 1 } },
  { to: "/tamat", label: "Tamat", icon: "fa-solid fa-circle-check", search: { page: 1 } },
  { to: "/genre", label: "Genre", icon: "fa-solid fa-tags" },
  { to: "/jadwal", label: "Jadwal", icon: "fa-solid fa-calendar-days" },
  { to: "/riwayat", label: "Riwayat", icon: "fa-solid fa-clock-rotate-left" },
] as const;

const MORE_LINKS = NAV.filter((item) => !["/", "/jadwal", "/riwayat"].includes(item.to));

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div onClick={() => setOpen(false)} aria-hidden="true" className="fixed inset-0 z-30 lg:hidden" />
      ) : null}
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <img src="/logo.svg" alt="Nontonime" className="h-8 w-8 rounded-xl" />
            Nontonime
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={("search" in item ? item.search : {}) as never}
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/cari"
              search={{ q: "", page: 1 }}
              aria-label="Cari anime"
              className="press-soft inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-card-foreground transition-colors hover:bg-accent"
            >
              <i className="fa-solid fa-magnifying-glass text-sm" />
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setOpen((value) => !value)}
              aria-label="Menu lainnya"
              className="press-soft inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-card-foreground transition-colors hover:bg-accent lg:hidden"
            >
              <i className={open ? "fa-solid fa-xmark" : "fa-solid fa-ellipsis-vertical"} />
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lainnya
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MORE_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  search={("search" in item ? item.search : {}) as never}
                  onClick={() => setOpen(false)}
                  className="press-soft flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 text-xs font-medium text-card-foreground transition-colors hover:bg-accent"
                >
                  <i className={`${item.icon} text-primary`} />
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
