import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/80 bg-card/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="space-y-3 sm:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
                nonton<span className="text-primary font-bold">ime</span>
              </span>
            </Link>
            <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
              Platform streaming dan informasi anime subtitle Indonesia terlengkap, gratis, dan
              tanpa ribet. Seluruh data disediakan oleh API pihak ketiga tanpa menyimpan berkas
              video di server kami.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Layanan Aktif
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/ongoing"
                  search={{ page: 1 }}
                  className="hover:text-primary transition-colors"
                >
                  Anime Ongoing
                </Link>
              </li>
              <li>
                <Link
                  to="/tamat"
                  search={{ page: 1 }}
                  className="hover:text-primary transition-colors"
                >
                  Anime Tamat
                </Link>
              </li>
              <li>
                <Link to="/jadwal" className="hover:text-primary transition-colors">
                  Jadwal Rilis
                </Link>
              </li>
              <li>
                <Link to="/genre" className="hover:text-primary transition-colors">
                  Daftar Genre
                </Link>
              </li>
            </ul>
          </div>

          {/* Fitur Pengguna */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
              Fitur Pengguna
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/watchlist" className="hover:text-primary transition-colors">
                  Daftar Watchlist
                </Link>
              </li>
              <li>
                <Link to="/riwayat" className="hover:text-primary transition-colors">
                  Riwayat Tontonan
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80">Multi Kualitas (360p - 720p HD)</span>
              </li>
              <li>
                <span className="text-muted-foreground/80">Mode Bioskop (Theater)</span>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
              Pernyataan
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Nontonime tidak mengunggah atau menyimpan berkas media apa pun. Semua konten
              disediakan oleh layanan pihak ketiga yang tidak berafiliasi.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Nontonime. Dibuat dengan antarmuka modern & responsif.</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/jadwal" className="hover:text-primary transition-colors">
              Jadwal
            </Link>
            <span>•</span>
            <Link
              to="/ongoing"
              search={{ page: 1 }}
              className="hover:text-primary transition-colors"
            >
              Ongoing
            </Link>
            <span>•</span>
            <Link to="/tamat" search={{ page: 1 }} className="hover:text-primary transition-colors">
              Tamat
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
