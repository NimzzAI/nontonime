import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { clearHistory, readHistory, removeHistory, type HistoryItem } from "@/lib/history";
import { SectionTitle } from "@/components/anime/StateViews";

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

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readHistory());
    sync();
    window.addEventListener("history-updated", sync);
    return () => window.removeEventListener("history-updated", sync);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    for (const item of items) {
      const label = dayLabel(item.watchedAt);
      const list = map.get(label) ?? [];
      list.push(item);
      map.set(label, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Riwayat Tontonan" icon="fa-solid fa-clock-rotate-left" />
        {items.length > 0 ? (
          <button
            onClick={() => clearHistory()}
            className="press-soft inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
          >
            <i className="fa-solid fa-trash text-xs" />
            Hapus Semua Riwayat
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Riwayat hanya disimpan secara lokal di browser kamu agar kamu bisa melanjutkan menonton
        kapan saja tanpa login akun.
      </p>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 px-6 py-16 text-center space-y-3 backdrop-blur-xs">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <i className="fa-solid fa-clock-rotate-left text-xl" />
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
              Mulai Nonton Anime
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, group]) => (
            <section key={label} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </h3>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                {group.map((item) => (
                  <li
                    key={item.episodeId}
                    className="flex items-center gap-3.5 p-3.5 hover:bg-accent/40 transition-colors"
                  >
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.animeTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="line-clamp-1 text-sm font-bold text-foreground">
                        {item.animeTitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="line-clamp-1 text-primary font-medium">
                          {item.episodeTitle}
                        </span>
                        <span className="shrink-0">• {formatTime(item.watchedAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to="/watch/$episodeId"
                        params={{ episodeId: item.episodeId }}
                        search={{ a: item.animeId }}
                        aria-label="Lanjutkan menonton"
                        className="press-soft flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform"
                      >
                        <i className="fa-solid fa-play ml-0.5 text-xs" />
                      </Link>
                      <button
                        onClick={() => removeHistory(item.episodeId)}
                        aria-label="Hapus riwayat"
                        title="Hapus dari riwayat"
                        className="press-soft flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <i className="fa-solid fa-xmark text-xs" />
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
