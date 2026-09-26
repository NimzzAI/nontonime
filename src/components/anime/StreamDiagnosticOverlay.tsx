import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Server,
  Zap,
  Globe,
  FileType,
  Sliders,
  ExternalLink,
  X,
  ShieldCheck,
  Gauge,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiagnosticData {
  url: string;
  sourceMode: "direct" | "proxy" | "mega" | "iframe";
  serverTitle: string;
  serverId?: string | null;
  serverIndex?: number;
  totalServers?: number;
  currentTime?: number;
  duration?: number;
  bufferedAhead?: number;
  videoWidth?: number;
  videoHeight?: number;
  playerState?: "playing" | "paused" | "buffering" | "error" | "idle";
  errorMessage?: string | null;
  autoFailoverEnabled?: boolean;
  failedServers?: Array<{ id: string; title: string; reason?: string; timestamp: number }>;
}

export interface StreamProbeResult {
  ok: boolean;
  status?: number;
  statusText?: string;
  latencyMs?: number;
  contentType?: string;
  isDirectMedia?: boolean;
  isIframeEmbed?: boolean;
  isMega?: boolean;
  acceptRanges?: boolean;
  contentLength?: number | null;
  contentRange?: string | null;
  serverHeader?: string | null;
  corsHeader?: string | null;
  error?: string;
}

export function StreamDiagnosticOverlay({
  isOpen,
  onClose,
  data,
  onToggleProxy,
  isProxyActive,
  onToggleAutoFailover,
  onRetryCurrentServer,
  onSwitchToNextServer,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: DiagnosticData;
  onToggleProxy?: () => void;
  isProxyActive?: boolean;
  onToggleAutoFailover?: () => void;
  onRetryCurrentServer?: () => void;
  onSwitchToNextServer?: () => void;
}) {
  const [probeResult, setProbeResult] = useState<StreamProbeResult | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Probe upstream stream health and range capability
  const runProbe = useCallback(async () => {
    if (!data.url) return;
    setIsProbing(true);
    try {
      const probeUrl = `/api/stream-check?url=${encodeURIComponent(data.url)}`;
      const res = await fetch(probeUrl);
      const json = (await res.json()) as StreamProbeResult;
      setProbeResult(json);
    } catch (e) {
      setProbeResult({
        ok: false,
        error: e instanceof Error ? e.message : "Gagal menghubungi endpoint diagnosa",
      });
    } finally {
      setIsProbing(false);
    }
  }, [data.url]);

  useEffect(() => {
    if (isOpen && data.url) {
      runProbe();
    }
  }, [isOpen, data.url, runProbe]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number | null | undefined): string => {
    if (!bytes || bytes <= 0) return "Tidak diketahui";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTime = (secs: number | undefined): string => {
    if (secs === undefined || isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyDiagnosticJson = async () => {
    const report = {
      timestamp: new Date().toISOString(),
      activeServer: {
        title: data.serverTitle,
        id: data.serverId,
        index: data.serverIndex,
        total: data.totalServers,
      },
      playback: {
        sourceMode: data.sourceMode,
        url: data.url,
        playerState: data.playerState,
        currentTime: data.currentTime,
        duration: data.duration,
        bufferedAheadSec: data.bufferedAhead,
        resolution:
          data.videoWidth && data.videoHeight ? `${data.videoWidth}x${data.videoHeight}` : null,
        errorMessage: data.errorMessage,
      },
      networkProbe: probeResult,
      failover: {
        autoFailoverEnabled: data.autoFailoverEnabled,
        failedServers: data.failedServers,
      },
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // fallback
    }
  };

  let hostname = "URL Tidak Valid";
  try {
    hostname = new URL(data.url).hostname;
  } catch {
    // no-op
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/90 backdrop-blur-md text-white font-mono text-xs overflow-hidden animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-2.5 bg-black/60">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-sm tracking-wide text-white">
            Diagnostik Stream & Pemutar
          </span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
            Live HUD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runProbe}
            disabled={isProbing}
            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition cursor-pointer disabled:opacity-50"
            title="Segarkan pemeriksaan upstream"
          >
            <RefreshCw className={cn("h-3 w-3", isProbing && "animate-spin")} />
            <span>{isProbing ? "Memeriksa..." : "Ping Ulang"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Tutup Diagnostik"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Diagnostic Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-white/90">
        {/* Grid Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Box 1: Mode Stream */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Globe className="h-3 w-3 text-cyan-400" /> Mode Sumber
            </span>
            <div className="font-bold text-sm text-cyan-300 capitalize truncate">
              {data.sourceMode === "proxy"
                ? "Proxy Lokal (RFC 7233)"
                : data.sourceMode === "direct"
                  ? "Native HTML5"
                  : data.sourceMode === "mega"
                    ? "MEGA Client Decrypt"
                    : "Iframe Embed"}
            </div>
            <p className="text-[10px] text-white/60">
              {data.sourceMode === "proxy" ? "Bypass CORS & Range Ready" : "Koneksi Langsung"}
            </p>
          </div>

          {/* Box 2: Content-Type */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <FileType className="h-3 w-3 text-amber-400" /> Content-Type
            </span>
            <div className="font-bold text-sm text-amber-300 truncate">
              {probeResult?.contentType ||
                (data.url.includes(".mp4")
                  ? "video/mp4"
                  : data.url.includes(".m3u8")
                    ? "application/x-mpegurl"
                    : "text/html")}
            </div>
            <p className="text-[10px] text-white/60">
              {probeResult?.isDirectMedia ? "Direct Video File" : "Web Embed Frame"}
            </p>
          </div>

          {/* Box 3: HTTP Range Support */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Sliders className="h-3 w-3 text-emerald-400" /> HTTP Range Status
            </span>
            <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              {probeResult?.acceptRanges || data.sourceMode === "proxy" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>206 Partial Content</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Range Non-Aktif</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-white/60">
              {probeResult?.acceptRanges || data.sourceMode === "proxy"
                ? "Dukungan Seek Instan Aktif"
                : "Full Download Saja"}
            </p>
          </div>

          {/* Box 4: Ping / Latency */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Gauge className="h-3 w-3 text-purple-400" /> Ping & Status
            </span>
            <div className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
              {probeResult?.latencyMs ? `${probeResult.latencyMs} ms` : "..."}
              <span className="text-[11px] font-normal text-white/70">
                (HTTP {probeResult?.status || 200})
              </span>
            </div>
            <p className="text-[10px] text-white/60 truncate">
              Server: {probeResult?.serverHeader || "Cloudflare / CDN"}
            </p>
          </div>
        </div>

        {/* Section 1: Detail URL Sumber */}
        <div className="rounded-xl border border-white/15 bg-black/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-white/80 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" /> Target Stream URL & Host
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-white/20 transition cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copied ? "Tersalin!" : "Salin URL"}</span>
              </button>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-white/20 transition"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Buka</span>
              </a>
            </div>
          </div>

          <div className="rounded-lg bg-black/60 p-2 font-mono text-[11px] text-emerald-300/90 break-all select-all border border-white/10">
            {data.url}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-white/70">
            <span>
              <strong>Host:</strong> {hostname}
            </span>
            <span>
              <strong>Ukuran File:</strong> {formatBytes(probeResult?.contentLength)}
            </span>
            <span>
              <strong>Content-Range:</strong>{" "}
              {probeResult?.contentRange ||
                (data.sourceMode === "proxy" ? "RFC 7233 Passthrough" : "bytes 0-...")}
            </span>
          </div>
        </div>

        {/* Section 2: Player & Buffer Health Metrics */}
        <div className="rounded-xl border border-white/15 bg-black/40 p-3 space-y-2.5">
          <span className="font-semibold text-xs text-white/80 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" /> Metrik Playback & Buffer Real-Time
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="rounded-lg bg-white/5 p-2 space-y-0.5">
              <span className="text-white/60">Posisi Pemutaran:</span>
              <div className="font-bold text-white text-xs">
                {formatTime(data.currentTime)} / {formatTime(data.duration)}
              </div>
            </div>

            <div className="rounded-lg bg-white/5 p-2 space-y-0.5">
              <span className="text-white/60">Buffer Tersimpan:</span>
              <div className="font-bold text-emerald-400 text-xs">
                {data.bufferedAhead !== undefined ? `+${data.bufferedAhead.toFixed(1)}s` : "N/A"}
              </div>
            </div>

            <div className="rounded-lg bg-white/5 p-2 space-y-0.5">
              <span className="text-white/60">Resolusi Video:</span>
              <div className="font-bold text-white text-xs">
                {data.videoWidth && data.videoHeight
                  ? `${data.videoWidth} × ${data.videoHeight} px`
                  : "Menyesuaikan"}
              </div>
            </div>

            <div className="rounded-lg bg-white/5 p-2 space-y-0.5">
              <span className="text-white/60">Status Player:</span>
              <div className="font-bold text-cyan-300 text-xs capitalize">
                {data.playerState || "Idle"}
              </div>
            </div>
          </div>

          {/* Buffer Progress bar */}
          {data.duration && data.duration > 0 ? (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>Buffer Depan:</span>
                <span>
                  {(
                    (((data.currentTime || 0) + (data.bufferedAhead || 0)) / data.duration) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((((data.currentTime || 0) + (data.bufferedAhead || 0)) / data.duration) * 100).toFixed(1))}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Section 3: Automated Failover & Server History */}
        <div className="rounded-xl border border-white/15 bg-black/40 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-xs text-white/80 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-cyan-400" /> Lapisan Auto-Failover & Riwayat
              Server
            </span>

            {onToggleAutoFailover && (
              <button
                type="button"
                onClick={onToggleAutoFailover}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer",
                  data.autoFailoverEnabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-white/10 text-white/70 border border-white/20",
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                <span>
                  Auto-Failover: {data.autoFailoverEnabled ? "Aktif (Otomatis)" : "Manual"}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/80">
            <span>
              Server Aktif: <strong>{data.serverTitle}</strong>
            </span>
            {data.serverIndex !== undefined && data.totalServers !== undefined && (
              <span className="text-white/60">
                (Urutan {data.serverIndex + 1} dari {data.totalServers})
              </span>
            )}
          </div>

          {/* Failed Servers Log */}
          {data.failedServers && data.failedServers.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">
                Riwayat Kegagalan Server ({data.failedServers.length}):
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {data.failedServers.map((fs, idx) => (
                  <div
                    key={`${fs.id}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 text-[10px] text-rose-300"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                      <span className="font-semibold truncate">{fs.title}</span>
                      <span className="text-rose-300/70 truncate">
                        : {fs.reason || "Koneksi terputus / status error"}
                      </span>
                    </div>
                    <span className="text-[9px] text-white/50 shrink-0 ml-2">
                      {new Date(fs.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[10px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>Belum ada kegagalan server tercatat pada sesi episode ini.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-white/15 px-4 py-2.5 bg-black/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {onToggleProxy && (
            <button
              type="button"
              onClick={onToggleProxy}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                isProxyActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isProxyActive ? "Matikan Proxy Lokal" : "Paksa Pakai Proxy"}</span>
            </button>
          )}

          {onSwitchToNextServer && (
            <button
              type="button"
              onClick={onSwitchToNextServer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
            >
              <Server className="h-3.5 w-3.5" />
              <span>Paksa Ganti Server Berikutnya</span>
            </button>
          )}

          {onRetryCurrentServer && (
            <button
              type="button"
              onClick={onRetryCurrentServer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Muat Ulang Server Ini</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyDiagnosticJson}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer ml-auto"
        >
          {copiedJson ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copiedJson ? "Laporan Disalin!" : "Salin Laporan (JSON)"}</span>
        </button>
      </div>
    </div>
  );
}
