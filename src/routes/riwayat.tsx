import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { clearHistory, readHistory, removeHistory, type HistoryItem } from "@/lib/history";
import { SectionTitle } from "@/components/anime/StateViews";

export const Route = createFileRoute("/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat Tontonan — Nontonime" },
      { name: "description", content: "Daftar episode anime yang pernah kamu tonton, tersimpan di perangkat ini." },
      { property: "og:title", content: "Riwayat Tontonan — Nontonime" },
      { property: "og:description", content: "Daftar episode anime yang pernah kamu tonton di perangkat ini." },
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
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000);
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
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-destructive transition-colors hover:border-destructive"
          >
            <i className="fa-solid fa-trash" />
            Hapus semua
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Riwayat hanya tersimpan di perangkat ini dan akan hilang jika cache atau data browser dibersihkan.
      </p>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <i className="fa-solid fa-film text-2xl text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada riwayat tontonan.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Mulai jelajahi anime
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, group]) => (
            <section key={label} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {group.map((item) => (
                  <li key={item.episodeId} className="flex items-center gap-3 p-3">
                    <img src={item.poster} alt={item.animeTitle} className="h-16 w-12 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-card-foreground">{item.animeTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="line-clamp-1">{item.episodeTitle}</span>
                        <span className="shrink-0">· {formatTime(item.watchedAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to="/watch/$episodeId"
                        params={{ episodeId: item.episodeId }}
                        search={{ a: item.animeId }}
                        aria-label="Lanjutkan menonton"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <i className="fa-solid fa-play text-xs" />
                      </Link>
                      <button
                        onClick={() => removeHistory(item.episodeId)}
                        aria-label="Hapus riwayat"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
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
