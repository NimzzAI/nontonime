import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Play,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  Trash2,
  Film,
  ExternalLink,
  Sparkles,
  CloudCheck,
  Search,
  Filter,
} from "lucide-react";
import {
  readWatchlist,
  updateEpisodeProgress,
  updateWatchlistStatus,
  removeFromWatchlist,
  type WatchlistItem,
  type WatchlistStatus,
} from "@/lib/watchlist";
import { useAuth, useFirestoreWatchlist } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface WatchingListProps {
  initialFilter?: "all" | WatchlistStatus;
  showHeader?: boolean;
  maxItems?: number;
  className?: string;
  onOpenAuth?: () => void;
}

export function WatchingList({
  initialFilter = "watching",
  showHeader = true,
  maxItems,
  className,
  onOpenAuth,
}: WatchingListProps) {
  const { user } = useAuth();
  // Real-time hook for Firestore watchlist if user is logged in
  const { items: firestoreItems, loading: firestoreLoading } = useFirestoreWatchlist(user?.uid);

  // Fallback to local storage if not logged in
  const items = user ? firestoreItems : readWatchlist();

  const [activeStatus, setActiveStatus] = useState<"all" | WatchlistStatus>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEpId, setEditingEpId] = useState<string | null>(null);
  const [tempEpValue, setTempEpValue] = useState<string>("");

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: items.length,
      watching: items.filter((i) => (i.status || "plan") === "watching").length,
      plan: items.filter((i) => (i.status || "plan") === "plan").length,
      completed: items.filter((i) => (i.status || "plan") === "completed").length,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeStatus !== "all") {
      result = result.filter((i) => (i.status || "plan") === activeStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }
    if (maxItems && maxItems > 0) {
      result = result.slice(0, maxItems);
    }
    return result;
  }, [items, activeStatus, searchQuery, maxItems]);

  const handleIncrementEpisode = (item: WatchlistItem, delta: number) => {
    const current = item.currentEpisode ?? 1;
    const total = item.totalEpisodes ?? 12;
    const nextVal = Math.max(1, Math.min(total > 0 ? total : 999, current + delta));
    updateEpisodeProgress(item.animeId, nextVal, total);
  };

  const handleSaveCustomEpisode = (animeId: string, totalEpisodes?: number) => {
    const parsed = parseInt(tempEpValue, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const total = totalEpisodes ?? 12;
      const valid = total > 0 ? Math.min(parsed, total) : parsed;
      updateEpisodeProgress(animeId, valid, total);
    }
    setEditingEpId(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header & Status Selector */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <span>Daftar Progres Anime</span>
                {user ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CloudCheck className="h-3 w-3" />
                    Firestore Cloud
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                  >
                    <span>Lokal (Login untuk Simpan di Cloud)</span>
                  </button>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Lacak episode terkini dan ubah status anime secara real-time.
              </p>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveStatus("watching")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                activeStatus === "watching"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Watching</span>
              <span className="rounded-full bg-black/20 dark:bg-white/20 px-1.5 py-0.2 text-[10px]">
                {counts.watching}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStatus("plan")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                activeStatus === "plan"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Clock className="h-3 w-3" />
              <span>Planning</span>
              <span className="rounded-full bg-black/20 dark:bg-white/20 px-1.5 py-0.2 text-[10px]">
                {counts.plan}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStatus("completed")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                activeStatus === "completed"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Completed</span>
              <span className="rounded-full bg-black/20 dark:bg-white/20 px-1.5 py-0.2 text-[10px]">
                {counts.completed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStatus("all")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                activeStatus === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
              )}
            >
              <span>Semua ({counts.all})</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Search */}
      {items.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari anime dalam daftar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 rounded-xl border border-border/80 bg-secondary/30 pl-8.5 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary focus:bg-background transition-all"
          />
        </div>
      )}

      {/* Loading state from Firestore */}
      {firestoreLoading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs">Memuat daftar watching dari Firestore...</p>
        </div>
      ) : null}

      {/* Empty State */}
      {!firestoreLoading && filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-3 bg-card/40">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-primary/10 text-primary">
            {activeStatus === "completed" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : activeStatus === "plan" ? (
              <Clock className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {activeStatus === "watching"
                ? "Belum ada anime yang sedang ditonton (Watching)"
                : activeStatus === "completed"
                  ? "Belum ada anime yang ditandai tamat (Completed)"
                  : activeStatus === "plan"
                    ? "Belum ada anime dalam daftar rencana (Planning)"
                    : "Belum ada anime di watchlist"}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
              {activeStatus === "watching"
                ? "Pilih anime favoritmu dan ubah statusnya ke 'Watching' untuk memantau episode terkini."
                : "Jelajahi anime populer di beranda dan simpan ke daftar tontonanmu."}
            </p>
          </div>
          <div className="pt-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <Film className="h-3 w-3" />
              <span>Jelajahi Anime</span>
            </Link>
          </div>
        </div>
      ) : (
        /* List of Watching / Planning / Completed Anime Cards */
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const currentStatus = item.status || "plan";
            const currentEp = item.currentEpisode ?? 1;
            const totalEp = item.totalEpisodes ?? 12;
            const progressPercent =
              totalEp > 0 ? Math.min(100, Math.round((currentEp / totalEp) * 100)) : 0;

            const isEditingThis = editingEpId === item.animeId;

            return (
              <div
                key={item.animeId}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                  {/* Poster Thumbnail */}
                  <Link
                    to="/anime/$animeId"
                    params={{ animeId: item.animeId }}
                    className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-muted group-hover:opacity-95"
                  >
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Film className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 text-white drop-shadow-sm" />
                    </div>
                  </Link>

                  {/* Info & Progress */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to="/anime/$animeId"
                          params={{ animeId: item.animeId }}
                          className="font-display text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Current Status Pill */}
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide",
                              currentStatus === "watching"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : currentStatus === "completed"
                                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
                            )}
                          >
                            {currentStatus === "watching"
                              ? "▶ Sedang Ditonton"
                              : currentStatus === "completed"
                                ? "✓ Tamat (Completed)"
                                : "⏳ Rencana (Planning)"}
                          </span>

                          <span className="text-[11px] text-muted-foreground">
                            {progressPercent}% Ditonton
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromWatchlist(item.animeId)}
                        title="Hapus dari daftar"
                        aria-label="Hapus dari watchlist"
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          currentStatus === "completed"
                            ? "bg-purple-500"
                            : currentStatus === "watching"
                              ? "bg-emerald-500"
                              : "bg-blue-500",
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Controls Row: Episode Tracker & Status Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      {/* Episode Counter Controls */}
                      <div className="flex items-center gap-1.5 bg-secondary/40 border border-border/80 rounded-xl px-2 py-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Episode:
                        </span>

                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={totalEp || 999}
                              value={tempEpValue}
                              onChange={(e) => setTempEpValue(e.target.value)}
                              autoFocus
                              className="h-6 w-14 rounded-md border border-primary bg-background px-1.5 text-center text-xs font-bold text-foreground focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveCustomEpisode(item.animeId, item.totalEpisodes)
                              }
                              className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEpId(item.animeId);
                              setTempEpValue(String(currentEp));
                            }}
                            title="Klik untuk ubah angka episode"
                            className="font-bold text-xs text-foreground hover:text-primary hover:underline px-1 rounded-sm cursor-pointer"
                          >
                            <span className="text-primary font-black">{currentEp}</span>
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              / {totalEp || "?"}
                            </span>
                          </button>
                        )}

                        <div className="flex items-center gap-0.5 border-l border-border/60 pl-1.5">
                          <button
                            type="button"
                            onClick={() => handleIncrementEpisode(item, -1)}
                            disabled={currentEp <= 1}
                            title="Kurangi 1 Episode"
                            className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIncrementEpisode(item, 1)}
                            disabled={totalEp > 0 && currentEp >= totalEp}
                            title="Tambah 1 Episode (+20 EXP)"
                            className="flex h-5 w-6 items-center justify-center rounded-md bg-primary/10 text-primary font-bold hover:bg-primary hover:text-primary-foreground disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            <span className="text-[10px]">+1</span>
                          </button>
                        </div>
                      </div>

                      {/* Fast Status Switcher Buttons: Completed or Planning or Watching */}
                      <div className="flex items-center gap-1.5">
                        {currentStatus !== "watching" && (
                          <button
                            type="button"
                            onClick={() => updateWatchlistStatus(item.animeId, "watching")}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                            <span>Set Watching</span>
                          </button>
                        )}

                        {currentStatus !== "completed" ? (
                          <button
                            type="button"
                            onClick={() => updateWatchlistStatus(item.animeId, "completed")}
                            className="inline-flex items-center gap-1 rounded-xl border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Tandai Selesai (+50 EXP)</span>
                          </button>
                        ) : null}

                        {currentStatus !== "plan" && (
                          <button
                            type="button"
                            onClick={() => updateWatchlistStatus(item.animeId, "plan")}
                            className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/50 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Clock className="h-2.5 w-2.5" />
                            <span>Ke Planning</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
