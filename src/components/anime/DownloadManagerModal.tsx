import { useState, useEffect, useCallback } from "react";
import {
  DownloadCloud,
  CheckCircle2,
  Pause,
  Play,
  X,
  Trash2,
  HardDrive,
  RefreshCw,
  Sliders,
  ExternalLink,
  Layers,
  FileVideo,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import {
  getOfflineEpisodes,
  getActiveTasks,
  getSavedTasks,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  deleteOfflineEpisode,
  clearAllOfflineEpisodes,
  getStorageEstimate,
  type OfflineEpisode,
  type DownloadTask,
  type StorageEstimateInfo,
} from "@/lib/download-manager";
import { OfflinePlayerModal } from "./OfflinePlayerModal";
import { cn } from "@/lib/utils";

export function DownloadManagerModal({
  isOpen,
  onClose,
  initialTab = "active",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "active" | "offline";
}) {
  const [activeTab, setActiveTab] = useState<"active" | "offline">(initialTab);
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [offlineEpisodes, setOfflineEpisodes] = useState<OfflineEpisode[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo>({
    usageBytes: 0,
    quotaBytes: 0,
    usagePercent: 0,
    offlineEpisodesCount: 0,
  });
  const [playingEpisode, setPlayingEpisode] = useState<OfflineEpisode | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const running = getActiveTasks();
      const saved = await getSavedTasks();
      // Combine running and saved tasks
      const taskMap = new Map<string, DownloadTask>();
      for (const t of saved) taskMap.set(t.id, t);
      for (const t of running) taskMap.set(t.id, t);
      setTasks(Array.from(taskMap.values()));

      const episodes = await getOfflineEpisodes();
      setOfflineEpisodes(episodes);

      const storage = await getStorageEstimate();
      setStorageInfo(storage);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, refreshData]);

  // Listen for real-time progress events from the downloader engine
  useEffect(() => {
    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener("nonton-downloads-updated", handleUpdate);
    const interval = setInterval(refreshData, 1000);

    return () => {
      window.removeEventListener("nonton-downloads-updated", handleUpdate);
      clearInterval(interval);
    };
  }, [refreshData]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bps: number): string => {
    if (!bps || bps <= 0) return "0 KB/s";
    const kbps = bps / 1024;
    if (kbps > 1024) {
      return `${(kbps / 1024).toFixed(2)} MB/s`;
    }
    return `${kbps.toFixed(0)} KB/s`;
  };

  const formatEta = (seconds: number): string => {
    if (!seconds || seconds <= 0 || !isFinite(seconds)) return "...";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handlePause = (taskId: string) => {
    pauseDownload(taskId);
    refreshData();
  };

  const handleResume = (taskId: string) => {
    resumeDownload(taskId);
    refreshData();
  };

  const handleCancel = (taskId: string) => {
    if (confirm("Batalkan pengunduhan episode ini?")) {
      cancelDownload(taskId);
      refreshData();
    }
  };

  const handleDeleteOffline = async (id: string) => {
    await deleteOfflineEpisode(id);
    refreshData();
  };

  const handleClearAll = async () => {
    if (confirm("Hapus seluruh episode anime yang tersimpan offline di perangkat ini?")) {
      await clearAllOfflineEpisodes();
      refreshData();
    }
  };

  const handleExportToFile = (episode: OfflineEpisode) => {
    if (!episode.blob) return;
    const url = URL.createObjectURL(episode.blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = `${episode.animeTitle}_Eps_${episode.episodeNumber}_${episode.quality}`
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    a.download = `${safeTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const activeDownloadsCount = tasks.filter((t) => t.status === "downloading").length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden text-foreground">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-xs">
                <DownloadCloud className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-foreground">
                    Download Manager & Koleksi Offline
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    <Layers className="h-3 w-3" />
                    Range Segmented
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unduh menggunakan HTTP Range request untuk ditonton offline tanpa kuota.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
              title="Tutup Download Manager"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-2.5 bg-background">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer",
                  activeTab === "active"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                <span>Unduhan Berjalan</span>
                {tasks.length > 0 && (
                  <span
                    className={cn(
                      "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      activeTab === "active"
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {tasks.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("offline")}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer",
                  activeTab === "offline"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                <span>Episode Tersimpan (Offline)</span>
                {offlineEpisodes.length > 0 && (
                  <span
                    className={cn(
                      "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      activeTab === "offline"
                        ? "bg-primary-foreground text-primary"
                        : "bg-muted-foreground/30 text-foreground",
                    )}
                  >
                    {offlineEpisodes.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={refreshData}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Perbarui daftar unduhan"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* TAB 1: ACTIVE / PAUSED DOWNLOADS */}
            {activeTab === "active" && (
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                      <DownloadCloud className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-foreground text-base">
                        Tidak Ada Unduhan Berjalan
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Pilih episode anime favorit Anda di halaman tonton, lalu klik tombol{" "}
                        <strong className="text-foreground">"Unduh Offline"</strong> untuk menyimpan
                        video segmen per segmen.
                      </p>
                    </div>
                  </div>
                ) : (
                  tasks.map((task) => {
                    const percent =
                      task.totalBytes > 0
                        ? Math.min(100, (task.downloadedBytes / task.totalBytes) * 100)
                        : 0;
                    const isDownloading = task.status === "downloading";
                    const isPaused = task.status === "paused";
                    const isProbing = task.status === "probing";
                    const isError = task.status === "error";

                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-3 shadow-xs transition hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 truncate">
                            {task.poster ? (
                              <img
                                src={task.poster}
                                alt={task.animeTitle}
                                className="h-12 w-9 rounded-lg object-cover border border-border/60 shrink-0"
                              />
                            ) : (
                              <div className="flex h-12 w-9 items-center justify-center rounded-lg bg-secondary shrink-0 text-muted-foreground">
                                <FileVideo className="h-5 w-5" />
                              </div>
                            )}

                            <div className="space-y-0.5 truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground truncate">
                                  {task.animeTitle}
                                </span>
                                <span className="rounded-md bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                                  {task.quality}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                Episode {task.episodeNumber} • {task.episodeTitle}
                              </p>
                            </div>
                          </div>

                          {/* Task Action Controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDownloading ? (
                              <button
                                type="button"
                                onClick={() => handlePause(task.id)}
                                className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition cursor-pointer"
                                title="Jeda Unduhan"
                              >
                                <Pause className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Jeda</span>
                              </button>
                            ) : isPaused || isError ? (
                              <button
                                type="button"
                                onClick={() => handleResume(task.id)}
                                className="inline-flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-xs"
                                title="Lanjutkan Unduhan"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span className="hidden sm:inline">Lanjutkan</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleCancel(task.id)}
                              className="rounded-xl border border-border/60 bg-secondary/40 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                              title="Batalkan Unduhan"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar & Numerical Metrics */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {isProbing ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                                  <span>Memeriksa stream Range...</span>
                                </>
                              ) : isPaused ? (
                                <span className="text-amber-500">
                                  Dijeda ({percent.toFixed(1)}%)
                                </span>
                              ) : isError ? (
                                <span className="text-destructive flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Gagal mengunduh
                                </span>
                              ) : (
                                <span>{percent.toFixed(1)}%</span>
                              )}
                            </span>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>
                                {formatBytes(task.downloadedBytes)} / {formatBytes(task.totalBytes)}
                              </span>
                              {isDownloading && task.speedBps > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-emerald-500">
                                    {formatSpeed(task.speedBps)}
                                  </span>
                                  <span>•</span>
                                  <span>{formatEta(task.etaSec)} lagi</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isError
                                  ? "bg-destructive"
                                  : isPaused
                                    ? "bg-amber-500"
                                    : "bg-primary",
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          {/* Segments count info */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                            <span>
                              Segmen Range HTTP: {task.completedChunks} / {task.chunksCount} blok
                            </span>
                            {task.errorMessage && (
                              <span className="text-destructive truncate max-w-xs">
                                {task.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: SAVED OFFLINE EPISODES */}
            {activeTab === "offline" && (
              <div className="space-y-3">
                {offlineEpisodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                      <WifiOff className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-foreground text-base">
                        Belum Ada Episode Tersimpan
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Episode yang selesai diunduh akan otomatis tersimpan di sini dan dapat
                        diputar langsung tanpa koneksi internet sama sekali.
                      </p>
                    </div>
                  </div>
                ) : (
                  offlineEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="rounded-2xl border border-border/80 bg-background/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-primary/40 transition"
                    >
                      <div className="flex items-center gap-3 truncate">
                        {ep.poster ? (
                          <img
                            src={ep.poster}
                            alt={ep.animeTitle}
                            className="h-14 w-10 rounded-xl object-cover border border-border/60 shrink-0"
                          />
                        ) : (
                          <div className="flex h-14 w-10 items-center justify-center rounded-xl bg-secondary shrink-0 text-muted-foreground">
                            <FileVideo className="h-5 w-5" />
                          </div>
                        )}

                        <div className="space-y-1 truncate">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {ep.animeTitle}
                            </h4>
                            <span className="rounded-md bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                              {ep.quality}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            Episode {ep.episodeNumber} • {ep.episodeTitle}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{formatBytes(ep.sizeBytes)}</span>
                            <span>•</span>
                            <span>
                              Disimpan {new Date(ep.downloadedAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Offline Episode Action Buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-border/40 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPlayingEpisode(ep)}
                          className="press-soft inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Tonton Offline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportToFile(ep)}
                          className="rounded-xl border border-border/80 bg-secondary/60 p-2 text-foreground hover:bg-secondary hover:text-primary transition cursor-pointer"
                          title="Simpan file ke disk komputer/ponsel"
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOffline(ep.id)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Hapus dari penyimpanan offline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Bar: Storage Quota & Global Actions */}
          <div className="border-t border-border/80 px-5 py-3 bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="space-y-1 w-full sm:w-64">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Penyimpanan Offline:</span>
                  <span className="font-semibold text-foreground">
                    {formatBytes(storageInfo.usageBytes)} / {formatBytes(storageInfo.quotaBytes)} (
                    {storageInfo.usagePercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, storageInfo.usagePercent)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {offlineEpisodes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Semua Offline</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Video Player Modal */}
      <OfflinePlayerModal
        episode={playingEpisode}
        isOpen={Boolean(playingEpisode)}
        onClose={() => setPlayingEpisode(null)}
        onDelete={(id) => {
          handleDeleteOffline(id);
          setPlayingEpisode(null);
        }}
      />
    </>
  );
}
