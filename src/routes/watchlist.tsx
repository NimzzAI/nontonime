import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Search,
  Download,
  Upload,
  Play,
  X,
  Compass,
  FileJson,
  Plus,
  LayoutGrid,
  List,
  CloudCheck,
} from "lucide-react";
import { SectionTitle } from "@/components/anime/StateViews";
import {
  readWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  updateEpisodeProgress,
  exportWatchlist,
  importWatchlist,
  type WatchlistItem,
  type WatchlistStatus,
} from "@/lib/watchlist";
import { useAuth, useFirestoreWatchlist } from "@/lib/firebase";
import { WatchingList } from "@/components/anime/WatchingList";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist Saya — Nontonime" },
      {
        name: "description",
        content: "Daftar anime yang disimpan, sedang ditonton, dan episode tracking di Nontonime.",
      },
      { property: "og:title", content: "Watchlist Saya — Nontonime" },
      {
        property: "og:description",
        content: "Daftar anime yang disimpan, sedang ditonton, dan episode tracking di Nontonime.",
      },
    ],
  }),
  component: WatchlistPage,
});

type FilterTab = "all" | WatchlistStatus;

const TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: "all", label: "Semua", icon: "fa-solid fa-layer-group" },
  { id: "watching", label: "Sedang Ditonton", icon: "fa-solid fa-play" },
  { id: "plan", label: "Rencana Tonton", icon: "fa-solid fa-clock" },
  { id: "completed", label: "Selesai", icon: "fa-solid fa-check-circle" },
];

function WatchlistPage() {
  const { user } = useAuth();
  const { items: firestoreItems } = useFirestoreWatchlist(user?.uid);
  const [localItems, setLocalItems] = useState<WatchlistItem[]>(readWatchlist());

  const items = user ? firestoreItems : localItems;

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<"grid" | "tracker">("tracker");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importNotice, setImportNotice] = useState<{ msg: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => setLocalItems(readWatchlist());
    sync();
    window.addEventListener("watchlist-updated", sync);
    return () => window.removeEventListener("watchlist-updated", sync);
  }, []);

  // Filter and search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && (item.status || "plan") !== activeTab) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  // Counts per tab
  const counts = useMemo(() => {
    return {
      all: items.length,
      watching: items.filter((i) => (i.status || "plan") === "watching").length,
      plan: items.filter((i) => (i.status || "plan") === "plan").length,
      completed: items.filter((i) => (i.status || "plan") === "completed").length,
    };
  }, [items]);

  // Handle export
  const handleExport = () => {
    const json = exportWatchlist();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nontonime-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const result = importWatchlist(text);
        if (result.error) {
          setImportNotice({ msg: result.error, error: true });
        } else {
          setImportNotice({
            msg: `Berhasil memulihkan ${result.count} anime ke Watchlist!`,
            error: false,
          });
          setLocalItems(readWatchlist());
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SectionTitle title="Watchlist & Pelacak Episode" icon="fa-solid fa-bookmark" />
            {user ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CloudCheck className="h-3 w-3" />
                Firestore Terhubung
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola koleksi anime yang sedang kamu ikuti, lacak episode yang sudah ditonton, dan
            simpan di Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-xl border border-border/80 bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("tracker")}
              title="Tampilan Pelacak Episode"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "tracker"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Pelacak</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Tampilan Grid Poster"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
          </div>

          {/* Backup / Export / Import button */}
          <button
            type="button"
            onClick={() => setShowBackupModal(true)}
            className="press-soft inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <FileJson className="h-3.5 w-3.5 text-primary" />
            Cadangkan
          </button>

          {items.length > 0 ? (
            <span className="text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-xl">
              {items.length} Anime
            </span>
          ) : null}
        </div>
      </div>

      {/* Tracker View */}
      {viewMode === "tracker" ? (
        <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
          <WatchingList initialFilter="watching" showHeader={true} />
        </div>
      ) : (
        /* Grid Poster View */
        <div className="space-y-4">
          {items.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
              {/* Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {TABS.map((tab) => {
                  const count = counts[tab.id];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "press-soft inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <i className={cn(tab.icon, "text-[11px]")} />
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px]",
                          isActive ? "bg-black/20 text-white" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick filter search */}
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari dalam watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8.5 w-full rounded-xl border border-border/80 bg-secondary/30 pl-8.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary/60 focus:bg-background"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Main Grid Content Items */}
          {items.length === 0 ? (
            <div className="rounded-3xl border border-border/80 bg-card/60 px-6 py-16 text-center space-y-3 backdrop-blur-xs">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bookmark className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">
                Belum ada anime yang disimpan di Watchlist
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Temukan anime favoritmu lalu klik tombol bookmark untuk menyimpannya ke daftar
                tontonan ini.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <Link
                  to="/"
                  className="press-soft inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Jelajahi Beranda
                </Link>
                <button
                  type="button"
                  onClick={() => setShowBackupModal(true)}
                  className="press-soft inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground shadow-sm hover:bg-accent cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  Pulihkan dari Cadangan
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Tidak ada anime yang sesuai dengan filter atau kata kunci &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredItems.map((item) => {
                const currentStatus = item.status || "plan";
                const currentEp = item.currentEpisode ?? 1;
                const totalEp = item.totalEpisodes ?? 12;
                const progressPercent =
                  totalEp > 0 ? Math.min(100, Math.round((currentEp / totalEp) * 100)) : 0;

                return (
                  <div
                    key={item.animeId}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/50"
                  >
                    <Link
                      to="/anime/$animeId"
                      params={{ animeId: item.animeId }}
                      className="card-lift block"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                        {item.poster ? (
                          <img
                            src={item.poster}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <i className="fa-solid fa-film text-xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                            <Play className="h-4 w-4 ml-0.5 fill-current" />
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-xs backdrop-blur-md",
                              currentStatus === "watching"
                                ? "bg-emerald-500/90 text-white"
                                : currentStatus === "completed"
                                  ? "bg-purple-500/90 text-white"
                                  : "bg-blue-500/90 text-white",
                            )}
                          >
                            {currentStatus === "watching"
                              ? "Ditonton"
                              : currentStatus === "completed"
                                ? "Selesai"
                                : "Rencana"}
                          </span>
                        </div>

                        {/* Episode badge on poster */}
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white drop-shadow-md bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                          <span>
                            Ep. {currentEp}/{totalEp || "?"}
                          </span>
                          <span>{progressPercent}%</span>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <h3 className="line-clamp-2 text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    </Link>

                    {/* Episode +1 Quick Button */}
                    <div className="px-2.5 pb-1 flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Progress:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const nextEp = currentEp + 1;
                          updateEpisodeProgress(item.animeId, nextEp, totalEp);
                        }}
                        disabled={totalEp > 0 && currentEp >= totalEp}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        <span>+1 Ep</span>
                      </button>
                    </div>

                    {/* Card Controls Footer: Status Selector & Remove */}
                    <div className="p-2.5 pt-1 border-t border-border/40 flex items-center justify-between gap-1 text-[11px]">
                      {/* Status Dropdown */}
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          updateWatchlistItem(item.animeId, {
                            status: e.target.value as WatchlistStatus,
                          })
                        }
                        className="h-6 w-full rounded-md border border-border/70 bg-secondary/60 px-1.5 text-[10px] font-semibold text-foreground focus:outline-hidden"
                      >
                        <option value="watching">▶ Watching</option>
                        <option value="plan">⏳ Planning</option>
                        <option value="completed">✓ Completed</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeFromWatchlist(item.animeId);
                        }}
                        aria-label="Hapus dari watchlist"
                        title="Hapus dari watchlist"
                        className="press-soft flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Backup & Restore Modal */}
      {showBackupModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowBackupModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Cadangkan & Pulihkan Watchlist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBackupModal(false);
                  setImportNotice(null);
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Kamu bisa mengunduh berkas cadangan JSON atau memulihkan data watchlist ke perangkat
              lain kapan saja.
            </p>

            {importNotice ? (
              <div
                className={cn(
                  "rounded-xl p-3 text-xs font-semibold",
                  importNotice.error
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                )}
              >
                {importNotice.msg}
              </div>
            ) : null}

            <div className="space-y-3 pt-1">
              {/* Export Button */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Ekspor ke Berkas JSON</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Unduh seluruh {items.length} anime yang tersimpan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={items.length === 0}
                  className="press-soft inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh JSON
                </button>
              </div>

              {/* Import Button */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Pulihkan dari Berkas JSON</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Unggah berkas cadangan nontonime yang pernah diunduh
                  </p>
                </div>
                <label className="press-soft inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent cursor-pointer shadow-xs shrink-0">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  Pilih Berkas
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
