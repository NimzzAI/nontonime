import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/anime/ThemeToggle";
import { SectionTitle } from "@/components/anime/StateViews";
import { siteConfig } from "@/lib/site-config";
import { readSubscriptions, removeSubscription, type SubscriptionItem } from "@/lib/subscriptions";
import { getPermission, requestNotificationPermission, showLocalNotification } from "@/lib/push";
import { readHistory } from "@/lib/history";
import { readWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist";
import { Bookmark, ChevronRight, Play, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — Nontonime" },
      { name: "description", content: "Pengaturan tampilan, notifikasi, dan informasi Nontonime." },
      { property: "og:title", content: "Profil — Nontonime" },
      { property: "og:description", content: "Pengaturan tampilan dan notifikasi Nontonime." },
    ],
  }),
  component: ProfilPage,
});

function NotificationCard() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission(getPermission());
    const sync = () => setSubs(readSubscriptions());
    sync();
    window.addEventListener("subs-updated", sync);
    return () => window.removeEventListener("subs-updated", sync);
  }, []);

  async function handleEnable() {
    setBusy(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    await showLocalNotification("Notifikasi uji coba", {
      body: "Kalau ini muncul di bar notifikasi HP kamu, berarti sudah aktif dan berfungsi.",
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-card-foreground">Notifikasi</p>
          <p className="text-xs text-muted-foreground">
            {permission === "unsupported"
              ? "Browser ini tidak mendukung notifikasi web."
              : permission === "granted"
                ? "Notifikasi aktif di perangkat ini."
                : permission === "denied"
                  ? "Notifikasi diblokir. Aktifkan lewat pengaturan browser."
                  : "Belum diaktifkan."}
          </p>
        </div>
        {permission === "granted" ? (
          <button
            onClick={handleTest}
            className="press-soft shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Tes
          </button>
        ) : permission === "default" ? (
          <button
            onClick={handleEnable}
            disabled={busy}
            className="press-soft shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Aktifkan
          </button>
        ) : null}
      </div>

      {subs.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Anime yang di-subscribe ({subs.length})
          </p>
          <ul className="space-y-1.5">
            {subs.map((item) => (
              <li key={item.animeId} className="flex items-center justify-between gap-2">
                <Link
                  to="/anime/$animeId"
                  params={{ animeId: item.animeId }}
                  className="line-clamp-1 text-sm text-card-foreground hover:text-primary"
                >
                  {item.animeTitle}
                </Link>
                <button
                  onClick={() => removeSubscription(item.animeId)}
                  aria-label="Berhenti subscribe"
                  className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StatsRow() {
  const [stats, setStats] = useState({ episodes: 0, watchlist: 0, subs: 0 });

  useEffect(() => {
    const sync = () =>
      setStats({
        episodes: readHistory().length,
        watchlist: readWatchlist().length,
        subs: readSubscriptions().length,
      });
    sync();
    window.addEventListener("history-updated", sync);
    window.addEventListener("watchlist-updated", sync);
    window.addEventListener("subs-updated", sync);
    return () => {
      window.removeEventListener("history-updated", sync);
      window.removeEventListener("watchlist-updated", sync);
      window.removeEventListener("subs-updated", sync);
    };
  }, []);

  const items = [
    { label: "Episode Ditonton", value: stats.episodes },
    { label: "Watchlist", value: stats.watchlist },
    { label: "Subscribe", value: stats.subs },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5 px-2 py-4 text-center">
          <span className="font-display text-xl font-bold text-foreground">{item.value}</span>
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProfileWatchlistSection() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const sync = () => setWatchlist(readWatchlist());
    sync();
    window.addEventListener("watchlist-updated", sync);
    return () => window.removeEventListener("watchlist-updated", sync);
  }, []);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold text-card-foreground">
            Watchlist Tersimpan ({watchlist.length})
          </h3>
        </div>
        {watchlist.length > 0 ? (
          <Link
            to="/watchlist"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Lihat Semua
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>

      {watchlist.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Belum ada anime yang disimpan di watchlist.
          </p>
          <Link
            to="/"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Cari Anime Favorit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {watchlist.slice(0, 6).map((item) => (
            <div
              key={item.animeId}
              className="group relative overflow-hidden rounded-xl border border-border/80 bg-background/50 transition-all hover:border-primary/50"
            >
              <Link to="/anime/$animeId" params={{ animeId: item.animeId }} className="block">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <p className="line-clamp-1 text-[11px] font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => removeFromWatchlist(item.animeId)}
                title="Hapus dari watchlist"
                aria-label={`Hapus ${item.title} dari watchlist`}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfilPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <SectionTitle title="Profil" icon="fa-solid fa-circle-user" />

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl text-secondary-foreground">
          <i className="fa-solid fa-circle-user" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">Tamu</p>
          <p className="text-xs text-muted-foreground">
            Belum ada sistem akun di {siteConfig.name}. Data profil tersimpan di perangkat ini.
          </p>
        </div>
      </div>

      <StatsRow />

      <ProfileWatchlistSection />

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium text-card-foreground">Tema Tampilan</p>
          <p className="text-xs text-muted-foreground">Ganti antara mode terang dan gelap.</p>
        </div>
        <ThemeToggle />
      </div>

      <NotificationCard />

      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        <Link
          to="/watchlist"
          className="flex items-center justify-between px-4 py-3 text-sm font-medium text-card-foreground hover:bg-secondary/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            Watchlist Lengkap
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/riwayat"
          className="flex items-center justify-between px-4 py-3 text-sm font-medium text-card-foreground hover:bg-secondary/40 transition-colors"
        >
          <span>Riwayat Tontonan</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
