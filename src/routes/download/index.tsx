import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DownloadCloud,
  Layers,
  HardDrive,
  Play,
  Trash2,
  RefreshCw,
  FileVideo,
  Pause,
  Sliders,
  WifiOff,
  CheckCircle2,
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
import { OfflinePlayerModal } from "@/components/anime/OfflinePlayerModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/download/")({
  head: () => ({
    meta: [
      { title: "Download Manager & Koleksi Offline — Nontonime" },
      {
        name: "description",
        content: "Kelola unduhan anime segmen Range dan tonton episode anime offline tanpa kuota.",
      },
      { property: "og:title", content: "Download Manager & Koleksi Offline — Nontonime" },
      {
        property: "og:description",
        content: "Unduh anime per segmen HTTP Range untuk tontonan offline tanpa internet.",
      },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
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
    refreshData();
    window.addEventListener("nonton-downloads-updated", refreshData);
    const interval = setInterval(refreshData, 1000);
    return () => {
      window.removeEventListener("nonton-downloads-updated", refreshData);
      clearInterval(interval);
    };
  }, [refreshData]);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bps: number): string => {
    if (!bps || bps <= 0) return "0 KB/s";
    const kbps = bps / 1024;
    if (kbps > 1024) return `${(kbps / 1024).toFixed(2)} MB/s`;
    return `${kbps.toFixed(0)} KB/s`;
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-xs">
            <DownloadCloud className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Download Manager & Koleksi Offline
              </h1>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Range RFC 7233
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Simpan anime favorit langsung ke memori peramban Anda untuk ditonton di mana saja
              tanpa koneksi internet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan</span>
          </button>
          <Link
            to="/"
            className="press-soft inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            <span>Jelajahi Anime</span>
          </Link>
        </div>
      </div>

      {/* Storage & Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <WifiOff className="h-3.5 w-3.5 text-emerald-400" /> Episode Offline
          </span>
          <div className="font-display text-2xl font-black text-foreground">
            {offlineEpisodes.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">tersimpan</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <DownloadCloud className="h-3.5 w-3.5 text-primary" /> Unduhan Aktif
          </span>
          <div className="font-display text-2xl font-black text-foreground">
            {tasks.filter((t) => t.status === "downloading").length}{" "}
            <span className="text-xs font-normal text-muted-foreground">berjalan</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-purple-400" /> Memori Offline
            </span>
            <span className="font-semibold text-foreground text-[11px]">
              {formatBytes(storageInfo.usageBytes)} / {formatBytes(storageInfo.quotaBytes)}
            </span>
          </span>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, storageInfo.usagePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section 1: In-Progress Downloads */}
      {tasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <DownloadCloud className="h-4 w-4 text-primary" />
              <span>Unduhan Sedang Berjalan ({tasks.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const percent =
                task.totalBytes > 0
                  ? Math.min(100, (task.downloadedBytes / task.totalBytes) * 100)
                  : 0;
              const isDownloading = task.status === "downloading";

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3">
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
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {task.animeTitle}
                          </h4>
                          <span className="rounded-md bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                            {task.quality}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Episode {task.episodeNumber} • {task.episodeTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDownloading ? (
                        <button
                          type="button"
                          onClick={() => {
                            pauseDownload(task.id);
                            refreshData();
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary cursor-pointer"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          <span>Jeda</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            resumeDownload(task.id);
                            refreshData();
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Lanjutkan</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Batalkan unduhan ini?")) {
                            cancelDownload(task.id);
                            refreshData();
                          }
                        }}
                        className="rounded-xl border border-border/60 bg-secondary/40 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Batalkan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {percent.toFixed(1)}%{" "}
                        <span className="font-normal text-muted-foreground">
                          ({formatBytes(task.downloadedBytes)} / {formatBytes(task.totalBytes)})
                        </span>
                      </span>
                      {isDownloading && task.speedBps > 0 && (
                        <span className="font-semibold text-emerald-500 text-[11px]">
                          {formatSpeed(task.speedBps)}
                        </span>
                      )}
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Saved Offline Anime Episodes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-emerald-400" />
            <span>Koleksi Episode Offline ({offlineEpisodes.length})</span>
          </h3>

          {offlineEpisodes.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                if (confirm("Hapus seluruh episode offline?")) {
                  await clearAllOfflineEpisodes();
                  refreshData();
                }
              }}
              className="text-xs text-rose-500 hover:underline cursor-pointer"
            >
              Hapus Semua Offline
            </button>
          )}
        </div>

        {offlineEpisodes.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card p-10 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <DownloadCloud className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-foreground text-base">
                Belum Ada Episode Tersimpan
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Buka salah satu anime dan tekan tombol <strong>"Unduh Offline"</strong> pada episode
                yang ingin kamu simpan.
              </p>
            </div>
            <Link
              to="/"
              className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              Cari Anime Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {offlineEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs hover:border-primary/40 transition flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  {ep.poster ? (
                    <img
                      src={ep.poster}
                      alt={ep.animeTitle}
                      className="h-16 w-11 rounded-xl object-cover border border-border/60 shrink-0"
                    />
                  ) : (
                    <div className="flex h-16 w-11 items-center justify-center rounded-xl bg-secondary shrink-0 text-muted-foreground">
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
                    <div className="text-[10px] text-muted-foreground">
                      {formatBytes(ep.sizeBytes)} •{" "}
                      {new Date(ep.downloadedAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlayingEpisode(ep)}
                    className="press-soft flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Tonton Offline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportToFile(ep)}
                    className="rounded-xl border border-border/80 bg-secondary/60 p-2 text-foreground hover:bg-secondary hover:text-primary transition cursor-pointer"
                    title="Simpan file ke disk"
                  >
                    <DownloadCloud className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await deleteOfflineEpisode(ep.id);
                      refreshData();
                    }}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Player Modal */}
      <OfflinePlayerModal
        episode={playingEpisode}
        isOpen={Boolean(playingEpisode)}
        onClose={() => setPlayingEpisode(null)}
        onDelete={async (id) => {
          await deleteOfflineEpisode(id);
          setPlayingEpisode(null);
          refreshData();
        }}
      />
    </div>
  );
}
