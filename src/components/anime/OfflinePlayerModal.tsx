import { useEffect, useRef, useState } from "react";
import {
  X,
  DownloadCloud,
  Trash2,
  HardDrive,
  Maximize,
  Minimize,
  Sliders,
  Sparkles,
  WifiOff,
  Share2,
} from "lucide-react";
import { type OfflineEpisode } from "@/lib/download-manager";
import { cn } from "@/lib/utils";

export function OfflinePlayerModal({
  episode,
  isOpen,
  onClose,
  onDelete,
}: {
  episode: OfflineEpisode | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isTheater, setIsTheater] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ambientLight, setAmbientLight] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Generate object URL for offline blob
  useEffect(() => {
    if (episode?.blob) {
      const url = URL.createObjectURL(episode.blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setBlobUrl(null);
      };
    }
  }, [episode]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  if (!isOpen || !episode) return null;

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const handleExportToFile = () => {
    if (!blobUrl || !episode) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    const safeTitle = `${episode.animeTitle}_Eps_${episode.episodeNumber}_${episode.quality}`
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    a.download = `${safeTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = () => {
    if (
      confirm(
        `Hapus "${episode.animeTitle} - Episode ${episode.episodeNumber}" dari penyimpanan offline?`,
      )
    ) {
      onDelete?.(episode.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={cn(
          "relative flex flex-col w-full rounded-2xl border border-white/20 bg-card shadow-2xl overflow-hidden text-foreground transition-all duration-300",
          isTheater ? "max-w-6xl" : "max-w-4xl",
        )}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-secondary/30">
          <div className="flex items-center gap-2.5 truncate">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              <WifiOff className="h-3 w-3" />
              <span>Offline Ready</span>
            </span>
            <span className="font-bold text-sm text-foreground truncate">
              {episode.animeTitle} : Episode {episode.episodeNumber}
            </span>
            <span className="rounded-md bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold">
              {episode.quality}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsTheater((prev) => !prev)}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
              title={isTheater ? "Mode Normal" : "Mode Bioskop"}
            >
              {isTheater ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
              title="Tutup Pemutar Offline"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {ambientLight && (
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 rounded-3xl bg-primary/30 blur-3xl opacity-60 pointer-events-none"
            />
          )}

          {blobUrl ? (
            <video
              ref={videoRef}
              src={blobUrl}
              controls
              playsInline
              autoPlay
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="h-8 w-8 animate-pulse text-primary" />
              <span>Membuka data offline dari memori perangkat...</span>
            </div>
          )}
        </div>

        {/* Player Bottom Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-background border-t border-border/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Speed Control Selector */}
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/60">
              <Sliders className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setPlaybackRate(rate)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-bold transition cursor-pointer",
                    playbackRate === rate
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Ambient Toggle */}
            <button
              type="button"
              onClick={() => setAmbientLight((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer",
                ambientLight
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Glow {ambientLight ? "On" : "Off"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs mr-2">
              Ukuran File: <strong>{formatBytes(episode.sizeBytes)}</strong>
            </span>

            {/* Save/Export to Disk */}
            <button
              type="button"
              onClick={handleExportToFile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3 py-1.5 font-bold text-foreground hover:bg-secondary hover:text-primary transition cursor-pointer"
              title="Simpan file MP4 ke penyimpanan komputer/ponsel Anda"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-primary" />
              <span>Simpan ke File Disk</span>
            </button>

            {/* Delete from Offline Storage */}
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-bold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
              title="Hapus episode ini dari memori offline browser"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
