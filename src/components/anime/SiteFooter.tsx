import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/ongoing", label: "Ongoing", search: { page: 1 } },
  { to: "/tamat", label: "Tamat", search: { page: 1 } },
  { to: "/genre", label: "Genre", search: undefined },
  { to: "/jadwal", label: "Jadwal", search: undefined },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Nontonime" className="h-6 w-6 rounded-lg" />
          <p className="font-display text-base font-bold tracking-tight text-foreground">
            Nontonime
          </p>
        </div>
        <p className="max-w-xl leading-relaxed">
          Katalog dan pemutar anime subtitle Indonesia tanpa perlu akun. Seluruh data, poster, dan
          tautan video berasal dari penyedia pihak ketiga — situs ini tidak meng-hosting berkas
          video apa pun.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              search={link.search as never}
              className="font-medium text-card-foreground hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
