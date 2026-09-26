import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  History,
  Trash2,
  Play,
  X,
  Search,
  Trophy,
  Flame,
  Tv,
  Hourglass,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { clearHistory, readHistory, removeHistory, type HistoryItem } from "@/lib/history";
import { SectionTitle } from "@/components/anime/StateViews";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat Tontonan — Nontonime" },
      {
        name: "description",
        content: "Daftar episode anime yang pernah kamu tonton di perangkat ini.",
      },
      { property: "og:title", content: "Riwayat Tontonan — Nontonime" },
      {
        property: "og:description",
        content: "Daftar episode anime yang pernah kamu tonton di perangkat ini.",
      },
    ],
  }),
  component: HistoryPage,
});

function formatTime(value: number) {
  return new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(value);
}

function dayLabel(value: number) {
  const date = new Date(value);
  const today = new Date();
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

function getOtakuRank(episodesCount: number) {
  if (episodesCount >= 50) {
    return {
      title: "Sultan Marathon 👑",
      level: "Legenda",
      progress: 100,
      next: "Puncak Pencapaian!",
    };
  }
  if (episodesCount >= 20) {
    return {
      title: "Binge Watcher Sejati 🌟",
      level: "Mahir",
      progress: Math.min(100, Math.round(((episodesCount - 20) / 30) * 100)),
      next: `${50 - episodesCount} episode lagi ke Sultan Marathon`,
    };
  }
  if (episodesCount >= 5) {
    return {
      title: "Penggemar Anime ⚡",
      level: "Menengah",
      progress: Math.min(100, Math.round(((episodesCount - 5) / 15) * 100)),
      next: `${20 - episodesCount} episode lagi ke Binge Watcher`,
    };
  }
  return {
    title: "Penonton Santai 🍿",
    level: "Pemula",
    progress: Math.min(100, Math.round((episodesCount / 5) * 100)),
    next: `${5 - episodesCount} episode lagi ke Penggemar Anime`,
  };
}

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    const sync = () => setItems(readHistory());
    sync();
    window.addEventListener("history-updated", sync);
    return () => window.removeEventListener("history-updated", sync);
  }, []);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return items;
    const q = searchFilter.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.animeTitle.toLowerCase().includes(q) || item.episodeTitle.toLowerCase().includes(q),
    );
  }, [items, searchFilter]);

  // Group by day label
  const groups = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    for (const item of filteredItems) {
      const label = dayLabel(item.watchedAt);
      const list = map.get(label) ?? [];
      list.push(item);
      map.set(label, list);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  // Watch Statistics
  const stats = useMemo(() => {
    const totalEpisodes = items.length;
    const totalMinutes = totalEpisodes * 23; // ~23 mins average per episode
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const uniqueAnimes = new Set(items.map((i) => i.animeId || i.animeTitle)).size;
    const rank = getOtakuRank(totalEpisodes);

    return {
      totalEpisodes,
      formattedTime: hours > 0 ? `${hours} Jam ${minutes} Mnt` : `${minutes} Menit`,
      uniqueAnimes,
      rank,
    };
  }, [items]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Page Title & Clear History */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionTitle title="Riwayat Tontonan" icon={History} />
          <p className="text-xs text-muted-foreground mt-1">
            Riwayat disimpan secara lokal di browser kamu agar kamu bisa melanjutkan menonton kapan
            saja.
          </p>
        </div>
        {items.length > 0 ? (
          <button
            onClick={() => clearHistory()}
            className="press-soft inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Semua Riwayat
          </button>
        ) : null}
      </div>

      {/* Watch Statistics Card */}
      {items.length > 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Statistik & Pencapaian Menonton
              </h3>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {stats.rank.title}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-secondary/40 p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1">
                <Tv className="h-3.5 w-3.5 text-blue-500" />
                <span>Episode Ditonton</span>
              </div>
              <p className="font-display text-lg sm:text-xl font-extrabold text-foreground">
                {stats.totalEpisodes}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/40 p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1">
                <Hourglass className="h-3.5 w-3.5 text-emerald-500" />
                <span>Total Waktu</span>
              </div>
              <p className="font-display text-lg sm:text-xl font-extrabold text-foreground">
                {stats.formattedTime}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/40 p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span>Judul Anime</span>
              </div>
              <p className="font-display text-lg sm:text-xl font-extrabold text-foreground">
                {stats.uniqueAnimes}
              </p>
            </div>
          </div>

          {/* Progress Bar towards next rank */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progres Peringkat: {stats.rank.level}</span>
              <span className="font-semibold text-foreground">{stats.rank.next}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
                style={{ width: `${stats.rank.progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter search in history */}
      {items.length > 0 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari dalam riwayat tontonan..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-border/80 bg-card pl-8.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary/60"
          />
          {searchFilter ? (
            <button
              type="button"
              onClick={() => setSearchFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Main List */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 px-6 py-16 text-center space-y-3 backdrop-blur-xs">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">
            Belum ada riwayat tontonan
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Episode yang kamu tonton akan otomatis tercatat di sini sehingga kamu tidak akan lupa
            episode terakhir.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Mulai Nonton Anime
            </Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Tidak ada episode yang cocok dengan &quot;{searchFilter}&quot;
          </p>
          <button
            type="button"
            onClick={() => setSearchFilter("")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Tampilkan Semua Riwayat
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, group]) => (
            <section key={label} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label} ({group.length})
              </h3>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                {group.map((item) => (
                  <li
                    key={`${item.episodeId}-${item.watchedAt}`}
                    className="group flex items-center justify-between gap-3 p-3 transition-colors hover:bg-secondary/40"
                  >
                    <Link
                      to="/watch/$episodeId"
                      params={{ episodeId: item.episodeId }}
                      search={{ a: item.animeId }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.animeTitle}
                          className="h-14 w-10 rounded-lg object-cover bg-muted shrink-0 shadow-xs"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Tv className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.animeTitle}
                        </h4>
                        <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                          {item.episodeTitle}
                        </p>
                        <span className="mt-1 inline-block text-[10px] text-muted-foreground/70 font-mono">
                          {formatTime(item.watchedAt)}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        to="/watch/$episodeId"
                        params={{ episodeId: item.episodeId }}
                        search={{ a: item.animeId }}
                        aria-label="Lanjutkan menonton"
                        className="press-soft inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span className="hidden sm:inline">Lanjutkan</span>
                      </Link>

                      <button
                        onClick={() => removeHistory(item.episodeId)}
                        aria-label="Hapus dari riwayat"
                        title="Hapus dari riwayat"
                        className="press-soft flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
