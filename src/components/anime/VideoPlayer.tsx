import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import {
  Loader2,
  AlertTriangle,
  ExternalLink,
  Maximize,
  Minimize,
  ShieldCheck,
  ShieldAlert,
  VolumeX,
  Volume2,
  Play,
  RotateCcw,
  FastForward,
  Server,
  Zap,
  Radio,
  Activity,
  ArrowRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamDiagnosticOverlay, type DiagnosticData } from "./StreamDiagnosticOverlay";

export interface NextEpisodeMeta {
  id: string;
  number: number;
  title: string;
}

export interface StreamServerOption {
  title: string;
  serverId: string;
  href?: string;
}

export interface FailedServerLog {
  id: string;
  title: string;
  reason?: string;
  timestamp: number;
}

function isDirectSource(url: string): boolean {
  if (!url) return false;
  return /\.(m3u8|mp4|webm|mkv)(\?|$)/i.test(url) || url.startsWith("/api/stream-proxy");
}

function isMegaSource(url: string): boolean {
  if (!url) return false;
  return /mega\.(nz|io)\/(embed|file)\//i.test(url);
}

function getProxiedStreamUrl(originalUrl: string): string {
  if (!originalUrl || originalUrl.startsWith("/api/stream-proxy")) return originalUrl;
  return `/api/stream-proxy?url=${encodeURIComponent(originalUrl)}`;
}

function formatIframeAutoplayUrl(url: string, shouldAutoplay: boolean): string {
  if (!shouldAutoplay || !url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("autoplay") && !parsed.searchParams.has("autoPlay")) {
      parsed.searchParams.set("autoplay", "1");
      parsed.searchParams.set("autoPlay", "1");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Native HTML5 / Video.js Player with HTTP Range Request support & Live Metrics Reporting.
 */
function NativePlayer({
  src,
  onEnded,
  autoPlay = false,
  nextEpisode,
  onPlayNext,
  serverTitle,
  servers = [],
  activeServerId,
  onSelectServer,
  onMetricsUpdate,
  onErrorDetected,
  useProxy,
  onToggleProxy,
}: {
  src: string;
  onEnded?: () => void;
  autoPlay?: boolean;
  nextEpisode?: NextEpisodeMeta | null;
  onPlayNext?: () => void;
  serverTitle?: string;
  servers?: StreamServerOption[];
  activeServerId?: string | null;
  onSelectServer?: (serverId: string) => void;
  onMetricsUpdate?: (metrics: {
    currentTime: number;
    duration: number;
    bufferedAhead: number;
    videoWidth: number;
    videoHeight: number;
    playerState: "playing" | "paused" | "buffering" | "error" | "idle";
  }) => void;
  onErrorDetected?: (errorMsg: string) => void;
  useProxy: boolean;
  onToggleProxy: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const endedFiredRef = useRef(false);
  const stallTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [isMutedAutoplay, setIsMutedAutoplay] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [playbackError, setPlaybackError] = useState<{ code?: number; message: string } | null>(
    null,
  );
  const playbackErrorRef = useRef(playbackError);
  playbackErrorRef.current = playbackError;

  // Active playback source (switches between direct and backend streaming proxy)
  const activeSourceUrl = useMemo(() => {
    if (useProxy) {
      return getProxiedStreamUrl(src);
    }
    return src;
  }, [src, useProxy]);

  // Reset states when base src changes
  useEffect(() => {
    endedFiredRef.current = false;
    setIsMutedAutoplay(false);
    setAutoplayFailed(false);
    setPlaybackError(null);
  }, [src]);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = document.createElement("video-js");
    element.classList.add("vjs-big-play-centered", "h-full", "w-full");
    containerRef.current.appendChild(element);

    const isHls = activeSourceUrl.includes(".m3u8");
    const mimeType = isHls ? "application/x-mpegURL" : "video/mp4";

    const player = videojs(element, {
      controls: true,
      fluid: false,
      preload: "auto",
      playsinline: true,
      autoplay: autoPlay ? true : false,
      sources: [{ src: activeSourceUrl, type: mimeType }],
    });

    const fireEnded = () => {
      if (endedFiredRef.current) return;
      endedFiredRef.current = true;
      onEnded?.();
    };

    // 1. Video.js player-level 'ended' event
    player.on("ended", fireEnded);

    // 2. Underlying HTML5 video native 'ended' event
    let techVideo: HTMLVideoElement | null = null;
    player.ready(() => {
      try {
        const tech = player.tech({ IWillNotUseThisInPlugins: true }) as
          { el?: () => Element } | undefined;
        const el = tech?.el?.();
        if (el instanceof HTMLVideoElement) {
          techVideo = el;
          techVideo.addEventListener("ended", fireEnded);
        }
      } catch {
        const queryEl = containerRef.current?.querySelector("video");
        if (queryEl) {
          techVideo = queryEl;
          techVideo.addEventListener("ended", fireEnded);
        }
      }
    });

    // Helper to calculate buffered ahead seconds
    const getBufferedAhead = (p: Player): number => {
      try {
        const cur = p.currentTime() || 0;
        const buf = p.buffered();
        if (buf && buf.length > 0) {
          for (let i = 0; i < buf.length; i++) {
            if (buf.start(i) <= cur && cur <= buf.end(i)) {
              return Math.max(0, buf.end(i) - cur);
            }
          }
        }
      } catch {
        // no-op
      }
      return 0;
    };

    // 3. Timeupdate & Live metrics reporting
    player.on("timeupdate", () => {
      const dur = player.duration() || 0;
      const cur = player.currentTime() || 0;
      if (dur > 5 && cur >= dur - 0.35) {
        fireEnded();
      }

      onMetricsUpdate?.({
        currentTime: cur,
        duration: dur,
        bufferedAhead: getBufferedAhead(player),
        videoWidth: player.videoWidth() || 0,
        videoHeight: player.videoHeight() || 0,
        playerState: player.paused() ? "paused" : "playing",
      });
    });

    // Buffering & Stall Monitoring
    player.on("waiting", () => {
      onMetricsUpdate?.({
        currentTime: player.currentTime() || 0,
        duration: player.duration() || 0,
        bufferedAhead: getBufferedAhead(player),
        videoWidth: player.videoWidth() || 0,
        videoHeight: player.videoHeight() || 0,
        playerState: "buffering",
      });

      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        // If stalled for over 10s on direct source, try auto-fallback to proxy first
        if (!useProxy && !playbackErrorRef.current) {
          console.warn("Direct stream stalled, attempting automatic proxy fallback...");
          onToggleProxy();
        } else if (useProxy && !playbackErrorRef.current) {
          // If already on proxy and still stalled for 10s, report error for automated failover
          const msg = "Buffer macet berkepanjangan (stalled >10 detik) pada server ini.";
          setPlaybackError({ code: 2, message: msg });
          onErrorDetected?.(msg);
        }
      }, 10000);
    });

    player.on("playing", () => {
      setPlaybackError(null);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      onMetricsUpdate?.({
        currentTime: player.currentTime() || 0,
        duration: player.duration() || 0,
        bufferedAhead: getBufferedAhead(player),
        videoWidth: player.videoWidth() || 0,
        videoHeight: player.videoHeight() || 0,
        playerState: "playing",
      });
    });

    player.on("pause", () => {
      onMetricsUpdate?.({
        currentTime: player.currentTime() || 0,
        duration: player.duration() || 0,
        bufferedAhead: getBufferedAhead(player),
        videoWidth: player.videoWidth() || 0,
        videoHeight: player.videoHeight() || 0,
        playerState: "paused",
      });
    });

    // Error handling with automated fallback and notification
    player.on("error", () => {
      const err = player.error();
      const errDetail =
        err?.message ||
        `Kesalahan media (Kode: ${err?.code || "Unknown"}) - Koneksi upstream ditolak`;
      console.warn("Video playback error encountered:", errDetail);

      if (!useProxy) {
        // Step 1: seamless auto-switch to local streaming proxy first
        console.info("Direct playback failed. Switching seamlessly to Local Streaming Proxy...");
        onToggleProxy();
      } else {
        // Step 2: Proxy also failed -> notify outer layer for automated server failover!
        setPlaybackError({
          code: err?.code,
          message: errDetail,
        });
        onMetricsUpdate?.({
          currentTime: player.currentTime() || 0,
          duration: player.duration() || 0,
          bufferedAhead: 0,
          videoWidth: player.videoWidth() || 0,
          videoHeight: player.videoHeight() || 0,
          playerState: "error",
        });
        onErrorDetected?.(errDetail);
      }
    });

    // Programmatic autoplay handling
    if (autoPlay) {
      player.ready(() => {
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Unmuted autoplay restricted by browser policy:", err);
            player.muted(true);
            const mutedPromise = player.play();
            if (mutedPromise !== undefined) {
              mutedPromise
                .then(() => {
                  setIsMutedAutoplay(true);
                })
                .catch(() => {
                  setAutoplayFailed(true);
                });
            } else {
              setAutoplayFailed(true);
            }
          });
        }
      });
    }

    playerRef.current = player;

    return () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      if (techVideo) {
        techVideo.removeEventListener("ended", fireEnded);
      }
      player.dispose();
      playerRef.current = null;
    };
  }, [
    activeSourceUrl,
    autoPlay,
    onEnded,
    useProxy,
    onMetricsUpdate,
    onErrorDetected,
    onToggleProxy,
  ]);

  const handleUnmute = () => {
    if (playerRef.current) {
      playerRef.current.muted(false);
      playerRef.current.volume(1);
      setIsMutedAutoplay(false);
    }
  };

  const handleManualPlay = () => {
    if (playerRef.current) {
      setAutoplayFailed(false);
      playerRef.current.muted(false);
      playerRef.current.volume(1);
      playerRef.current.play();
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" data-vjs-player />

      {/* Muted autoplay notification */}
      {isMutedAutoplay && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <VolumeX className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="font-medium text-[11px] sm:text-xs">
            Diputar tanpa suara (kebijakan browser)
          </span>
          <button
            type="button"
            onClick={handleUnmute}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-bold text-[11px] text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
          >
            <Volume2 className="h-3 w-3" />
            <span>Aktifkan Suara</span>
          </button>
        </div>
      )}

      {/* Proxy Streaming Status Indicator */}
      {useProxy && !playbackError && (
        <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 shadow-md">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Proxy Lokal Aktif (HTTP Range)</span>
        </div>
      )}

      {/* Autoplay-Failed Fallback Overlay */}
      {autoplayFailed && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xs p-4 text-center animate-in fade-in duration-200">
          <div className="rounded-2xl border border-white/20 bg-black/95 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/25 text-primary border border-primary/40 animate-pulse">
              <Play className="h-7 w-7 fill-current ml-0.5" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-0.5 text-[11px] font-bold text-primary">
                <FastForward className="h-3 w-3" />
                <span>Episode Berikutnya Siap</span>
              </div>
              <h4 className="font-display font-bold text-white text-base truncate">
                {nextEpisode
                  ? nextEpisode.title || `Episode ${nextEpisode.number}`
                  : "Episode Berikutnya"}
              </h4>
              <p className="text-xs text-muted-foreground">
                Browser membatasi pemutaran otomatis. Klik tombol di bawah untuk melanjutkan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleManualPlay}
                className="press-soft w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Putar Episode Berikutnya</span>
              </button>

              {onPlayNext && (
                <button
                  type="button"
                  onClick={onPlayNext}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-3 px-4 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <span>Lanjut</span>
                  <FastForward className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main VideoPlayer Component.
 *
 * Features:
 * 1. Automated Error-Handling Layer: Detects playback failures and automatically switches to the next available server URL.
 * 2. Diagnostic Overlay: Displays active streaming source, content-type, HTTP range support, and buffer health.
 * 3. Local HTTP Range Proxy Fallback for zero-buffering seeking.
 * 4. MEGA Client-side decrypted embed with sandbox protection.
 */
export function VideoPlayer({
  src,
  onToggleTheater,
  isTheater = false,
  onEnded,
  autoPlay = false,
  episodeTitle,
  isLoading = false,
  nextEpisode,
  onPlayNext,
  servers = [],
  activeServerId,
  activeServerTitle,
  onSelectServer,
  isResolvingServer = false,
  autoFailoverEnabled = true,
  onToggleAutoFailover,
  failedServerList = [],
  onRecordFailedServer,
  onResetFailedServers,
}: {
  src: string | null;
  onToggleTheater?: () => void;
  isTheater?: boolean;
  onEnded?: () => void;
  autoPlay?: boolean;
  episodeTitle?: string;
  isLoading?: boolean;
  nextEpisode?: NextEpisodeMeta | null;
  onPlayNext?: () => void;
  servers?: StreamServerOption[];
  activeServerId?: string | null;
  activeServerTitle?: string;
  onSelectServer?: (serverId: string) => void;
  isResolvingServer?: boolean;
  autoFailoverEnabled?: boolean;
  onToggleAutoFailover?: () => void;
  failedServerList?: FailedServerLog[];
  onRecordFailedServer?: (serverId: string, reason?: string) => void;
  onResetFailedServers?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const [adShieldActive, setAdShieldActive] = useState(true);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  // Automated Failover State
  const [autoFailoverState, setAutoFailoverState] = useState<{
    isTriggering: boolean;
    nextServerId: string | null;
    nextServerTitle: string | null;
    countdownSec: number;
    reason: string;
  } | null>(null);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live Metrics State for Diagnostic HUD
  const [metrics, setMetrics] = useState<{
    currentTime: number;
    duration: number;
    bufferedAhead: number;
    videoWidth: number;
    videoHeight: number;
    playerState: "playing" | "paused" | "buffering" | "error" | "idle";
  }>({
    currentTime: 0,
    duration: 0,
    bufferedAhead: 0,
    videoWidth: 0,
    videoHeight: 0,
    playerState: "idle",
  });

  const clearFailoverCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoFailoverState(null);
  }, []);

  // Reset error states when server/src changes
  useEffect(() => {
    setHasError(false);
    clearFailoverCountdown();
  }, [src, activeServerId, clearFailoverCountdown]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Listen for iframe postMessage player events (ended, completed)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (
          data?.event === "ended" ||
          data?.type === "ended" ||
          data === "ended" ||
          data?.event === "finish" ||
          data?.status === "complete"
        ) {
          onEnded?.();
        }
      } catch {
        // no-op
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEnded]);

  const isDirect = src ? isDirectSource(src) : false;
  const isMega = src ? isMegaSource(src) : false;
  const iframeSrc = src ? formatIframeAutoplayUrl(src, autoPlay) : "";

  // Helper: Find next unfailed server in the available server list
  const findNextAvailableServer = useCallback((): StreamServerOption | null => {
    if (!servers || servers.length === 0) return null;
    const failedIds = new Set(failedServerList.map((f) => f.id));
    if (activeServerId) {
      failedIds.add(activeServerId);
    }

    // Try finding next server sequentially after current server index
    const currentIndex = servers.findIndex((s) => s.serverId === activeServerId);
    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < servers.length; i++) {
        if (!failedIds.has(servers[i].serverId)) {
          return servers[i];
        }
      }
      for (let i = 0; i < currentIndex; i++) {
        if (!failedIds.has(servers[i].serverId)) {
          return servers[i];
        }
      }
    } else {
      for (const s of servers) {
        if (!failedIds.has(s.serverId)) {
          return s;
        }
      }
    }
    return null;
  }, [servers, failedServerList, activeServerId]);

  // Core Automated Error-Handling Layer
  const triggerAutomatedFailover = useCallback(
    (reason: string) => {
      setHasError(true);
      if (activeServerId) {
        onRecordFailedServer?.(activeServerId, reason);
      }

      if (!autoFailoverEnabled || !onSelectServer) {
        return;
      }

      const next = findNextAvailableServer();
      if (!next) {
        // All servers exhausted!
        console.warn("Automated failover: All available servers have failed.");
        setAutoFailoverState(null);
        return;
      }

      console.info(
        `Automated failover triggered: ${activeServerTitle || "Server"} failed. Auto-switching to next server: ${next.title}...`,
      );

      // Start seamless 2.5s countdown before switching
      let count = 2;
      setAutoFailoverState({
        isTriggering: true,
        nextServerId: next.serverId,
        nextServerTitle: next.title,
        countdownSec: count,
        reason,
      });

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setAutoFailoverState(null);
          setHasError(false);
          onSelectServer(next.serverId);
        } else {
          setAutoFailoverState((prev) => (prev ? { ...prev, countdownSec: count } : null));
        }
      }, 1000);
    },
    [
      activeServerId,
      activeServerTitle,
      autoFailoverEnabled,
      findNextAvailableServer,
      onRecordFailedServer,
      onSelectServer,
    ],
  );

  const handleExecuteImmediateSwitch = () => {
    if (autoFailoverState?.nextServerId && onSelectServer) {
      const nextId = autoFailoverState.nextServerId;
      clearFailoverCountdown();
      setHasError(false);
      onSelectServer(nextId);
    }
  };

  const handleCancelFailover = () => {
    clearFailoverCountdown();
  };

  const currentServerIndex = servers.findIndex((s) => s.serverId === activeServerId);

  // Diagnostic Payload
  const diagnosticData: DiagnosticData = {
    url: src || "",
    sourceMode: proxyEnabled ? "proxy" : isDirect ? "direct" : isMega ? "mega" : "iframe",
    serverTitle: activeServerTitle || "Server Utama",
    serverId: activeServerId,
    serverIndex: currentServerIndex >= 0 ? currentServerIndex : 0,
    totalServers: servers.length,
    currentTime: metrics.currentTime,
    duration: metrics.duration,
    bufferedAhead: metrics.bufferedAhead,
    videoWidth: metrics.videoWidth,
    videoHeight: metrics.videoHeight,
    playerState: metrics.playerState,
    errorMessage: hasError ? "Koneksi stream ditolak atau gagal memuat" : null,
    autoFailoverEnabled,
    failedServers: failedServerList,
  };

  const allServersFailed =
    servers.length > 0 &&
    failedServerList.length >= servers.length &&
    Boolean(activeServerId && failedServerList.some((f) => f.id === activeServerId));

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
        {/* Loading Screen */}
        {isLoading || isResolvingServer || !src ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground bg-black/90 p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="font-medium text-xs sm:text-sm text-white">
              {isResolvingServer
                ? "Menghubungkan ke server terpilih..."
                : isLoading
                  ? "Menyiapkan stream video..."
                  : "Memilih server terbaik..."}
            </span>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Mempersiapkan jalur streaming dan verifikasi failover otomatis...
            </p>
          </div>
        ) : isDirect ? (
          /* Native Player (HTML5 / Video.js) */
          <NativePlayer
            src={proxyEnabled ? getProxiedStreamUrl(src) : src}
            onEnded={onEnded}
            autoPlay={autoPlay}
            nextEpisode={nextEpisode}
            onPlayNext={onPlayNext}
            serverTitle={activeServerTitle}
            servers={servers}
            activeServerId={activeServerId}
            onSelectServer={onSelectServer}
            onMetricsUpdate={setMetrics}
            onErrorDetected={(reason) => triggerAutomatedFailover(reason)}
            useProxy={proxyEnabled}
            onToggleProxy={() => setProxyEnabled((prev) => !prev)}
          />
        ) : isMega ? (
          /* MEGA Encrypted Player with Client-side Decryption */
          <div className="relative h-full w-full bg-black">
            <div className="absolute top-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs text-white shadow-xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-[11px]">
                  Server MEGA (Dekripsi End-to-End di Browser)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Buka di MEGA
                </a>
              </div>
            </div>

            <iframe
              key={`mega-${iframeSrc}`}
              src={iframeSrc}
              title={episodeTitle || "MEGA Video Player"}
              className="h-full w-full border-0 pt-8"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen"
              referrerPolicy="origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-presentation"
              onError={() => triggerAutomatedFailover("Server MEGA menolak memuat iframe")}
            />
          </div>
        ) : (
          /* Standard Embed Player with Ad Shield */
          <iframe
            key={`${iframeSrc}-${adShieldActive}`}
            src={iframeSrc}
            title={episodeTitle || "Pemutar video"}
            className="h-full w-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer"
            sandbox={
              adShieldActive
                ? "allow-scripts allow-same-origin allow-forms allow-presentation"
                : undefined
            }
            onError={() => triggerAutomatedFailover("Server Embed menolak koneksi frame")}
          />
        )}

        {/* AUTOMATED FAILOVER COUNTDOWN OVERLAY BANNER */}
        {autoFailoverState?.isTriggering && (
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 rounded-2xl bg-black/90 backdrop-blur-md border border-primary/50 p-3 text-white shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
                <Server className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">
                    Mengalihkan Otomatis ke: {autoFailoverState.nextServerTitle}
                  </span>
                  <span className="rounded-full bg-primary/25 border border-primary/40 px-2 py-0.2 text-[10px] font-bold text-primary">
                    {autoFailoverState.countdownSec}s
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                  Server {activeServerTitle || "saat ini"} mengalami kendala. Mengalihkan tanpa
                  intervensi manual...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleExecuteImmediateSwitch}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-sm"
              >
                <span>Beralih Sekarang</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleCancelFailover}
                className="rounded-xl border border-white/20 bg-white/10 p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                title="Batalkan peralihan otomatis"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ALL SERVERS FAILED OR PLAYBACK HALTED ERROR CARD */}
        {hasError && !autoFailoverState?.isTriggering && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xs p-4 sm:p-6 text-center animate-in fade-in duration-200">
            <div className="rounded-2xl border border-destructive/40 bg-black/95 p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-white text-base">
                  {allServersFailed
                    ? "Semua Server Telah Dicoba & Gagal"
                    : "Kendala Pemutaran Server"}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {allServersFailed
                    ? "Sistem telah mencoba seluruh server video yang tersedia untuk episode ini namun semuanya ditolak atau tidak merespons."
                    : "Server ini sedang mengalami gangguan dari penyedia. Anda dapat memilih server lain di bawah atau membuka diagnostik."}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {allServersFailed && onResetFailedServers && servers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onResetFailedServers();
                      setHasError(false);
                      if (servers[0] && onSelectServer) {
                        onSelectServer(servers[0].serverId);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Coba Ulang Semua Server
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHasError(false);
                      setProxyEnabled((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {proxyEnabled ? "Coba Stream Langsung" : "Coba Lewat Proxy Lokal"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDiagnosticOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  Buka Diagnostik Stream
                </button>

                {src && (
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Tab Baru
                  </a>
                )}
              </div>

              {/* Alternative Server Grid Switcher */}
              {servers.length > 0 && onSelectServer && (
                <div className="pt-3 border-t border-white/15 space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-primary" />
                    <span>Pilih server alternatif:</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {servers.map((srv) => {
                      const isCurrent = srv.serverId === activeServerId;
                      const hasFailed = failedServerList.some((f) => f.id === srv.serverId);
                      return (
                        <button
                          key={srv.serverId}
                          type="button"
                          onClick={() => {
                            setHasError(false);
                            onSelectServer(srv.serverId);
                          }}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                            isCurrent
                              ? "bg-primary/30 text-primary border border-primary/50"
                              : hasFailed
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                                : "bg-white/10 text-white hover:bg-primary hover:text-primary-foreground",
                          )}
                        >
                          <span>{srv.title}</span>
                          {hasFailed && <span className="ml-1 text-[9px] opacity-70">(Gagal)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REAL-TIME DIAGNOSTIC OVERLAY MODAL */}
        <StreamDiagnosticOverlay
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
          data={diagnosticData}
          isProxyActive={proxyEnabled}
          onToggleProxy={() => setProxyEnabled((prev) => !prev)}
          onToggleAutoFailover={onToggleAutoFailover}
          onRetryCurrentServer={() => {
            setHasError(false);
            if (activeServerId && onSelectServer) {
              onSelectServer(activeServerId);
            }
          }}
          onSwitchToNextServer={() => {
            const next = findNextAvailableServer();
            if (next && onSelectServer) {
              setHasError(false);
              onSelectServer(next.serverId);
            }
          }}
        />
      </div>

      {/* Control & Indicator Toolbar Beneath Player */}
      {src ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dot & Stream Mode */}
            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isDirect
                ? proxyEnabled
                  ? "Proxy Lokal (HTTP Range RFC 7233)"
                  : "Stream Native HD (Direct)"
                : isMega
                  ? "MEGA Encrypted Stream"
                  : "Embed Stream Siap"}
            </span>

            {/* Direct Proxy Toggle */}
            {isDirect && (
              <button
                type="button"
                onClick={() => setProxyEnabled((prev) => !prev)}
                title={
                  proxyEnabled
                    ? "Streaming menggunakan backend proxy lokal dengan dukungan HTTP Range Request"
                    : "Klik untuk mengaktifkan Proxy Lokal jika video buffering atau menolak koneksi"
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer",
                  proxyEnabled
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Zap className="h-3 w-3" />
                <span>{proxyEnabled ? "Proxy Aktif" : "Gunakan Proxy"}</span>
              </button>
            )}

            {/* Auto-Failover Status Badge */}
            {onToggleAutoFailover && (
              <button
                type="button"
                onClick={onToggleAutoFailover}
                title="Lapisan penanganan error otomatis: Otomatis berpindah ke server berikutnya jika playback gagal tanpa intervensi manual"
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer",
                  autoFailoverEnabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Auto-Failover: {autoFailoverEnabled ? "On" : "Off"}</span>
              </button>
            )}

            {/* Ad Shield Toggle for Iframes */}
            {!isDirect && !isMega && (
              <button
                type="button"
                onClick={() => setAdShieldActive((prev) => !prev)}
                title={
                  adShieldActive
                    ? "Ad Shield Aktif: Pop-up iklan dan pengalihan otomatis diblokir"
                    : "Ad Shield Nonaktif: Klik untuk mengaktifkan perlindungan iklan"
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer",
                  adShieldActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
                )}
              >
                {adShieldActive ? (
                  <>
                    <ShieldCheck className="h-3 w-3" />
                    <span>Anti-Iklan Aktif</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3 w-3" />
                    <span>Anti-Iklan Mati</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* DIAGNOSTIC OVERLAY TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsDiagnosticOpen((prev) => !prev)}
              title="Buka panel diagnostik stream: Memantau sumber aktif, content-type, HTTP Range, latensi, dan riwayat failover"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-card-foreground transition cursor-pointer",
                isDiagnosticOpen
                  ? "border-primary bg-primary/20 text-primary font-bold"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Diagnostik</span>
            </button>

            {onToggleTheater ? (
              <button
                type="button"
                onClick={onToggleTheater}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent cursor-pointer"
              >
                {isTheater ? (
                  <Minimize className="h-3.5 w-3.5" />
                ) : (
                  <Maximize className="h-3.5 w-3.5" />
                )}
                {isTheater ? "Normal" : "Bioskop"}
              </button>
            ) : null}

            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka Tab Baru
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
