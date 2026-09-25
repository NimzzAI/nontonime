import { useEffect, useRef, useState, useMemo } from "react";
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
  Info,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function isDirectSource(url: string): boolean {
  if (!url) return false;
  return /\.(m3u8|mp4|webm|mkv)(\?|$)/i.test(url) || url.startsWith("/api/stream-proxy");
}

export function isMegaSource(url: string): boolean {
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
 * Native HTML5 / Video.js Player with automatic Streaming Proxy Fallback & HTTP Range Request support.
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
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const endedFiredRef = useRef(false);
  const stallTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [useProxy, setUseProxy] = useState(false);
  const [isMutedAutoplay, setIsMutedAutoplay] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [playbackError, setPlaybackError] = useState<{ code?: number; message: string } | null>(
    null,
  );
  const playbackErrorRef = useRef(playbackError);
  playbackErrorRef.current = playbackError;
  const [isBuffering, setIsBuffering] = useState(true);

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
    setIsBuffering(true);
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

    // 3. Backup threshold monitor
    player.on("timeupdate", () => {
      const dur = player.duration();
      const cur = player.currentTime();
      if (dur > 5 && cur >= dur - 0.35) {
        fireEnded();
      }
    });

    // Buffering & Stall Monitoring
    player.on("waiting", () => {
      setIsBuffering(true);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        // If stalled for over 12s on direct source, try auto-fallback to proxy
        if (!useProxy && !playbackErrorRef.current) {
          console.warn("Direct stream stalled, attempting automatic proxy fallback...");
          setUseProxy(true);
        }
      }, 12000);
    });

    player.on("playing", () => {
      setIsBuffering(false);
      setPlaybackError(null);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
    });

    player.on("canplay", () => {
      setIsBuffering(false);
    });

    // Error handling with automatic fallback to Backend Streaming Proxy
    player.on("error", () => {
      const err = player.error();
      console.warn("Video playback error encountered:", err);

      if (!useProxy) {
        // Auto-switch to backend streaming proxy (supports HTTP Range requests & handles CORS)
        console.info("Direct playback failed. Switching seamlessly to Local Streaming Proxy...");
        setUseProxy(true);
      } else {
        // If proxy also failed, present clear diagnostic to user with server switcher
        setPlaybackError({
          code: err?.code,
          message:
            err?.message ||
            "Server streaming ini menolak koneksi atau tidak kompatibel dengan browser. Silakan coba server lain.",
        });
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
  }, [activeSourceUrl, autoPlay, onEnded, useProxy]);

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

  const handleRetryWithProxy = () => {
    setPlaybackError(null);
    setUseProxy(true);
  };

  const handleRetryDirect = () => {
    setPlaybackError(null);
    setUseProxy(false);
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

      {/* Autoplay-Failed Fallback Overlay: "Next Episode" Play Button */}
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
                Browser membatasi pemutaran otomatis. Klik tombol di bawah untuk melanjutkan
                menonton.
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

      {/* Playback Error Overlay with Interactive Server Switcher */}
      {playbackError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xs p-4 sm:p-6 text-center animate-in fade-in duration-200">
          <div className="rounded-2xl border border-destructive/40 bg-black/95 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive border border-destructive/30">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-white text-base">
                Kendala Pemutaran Server
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {playbackError.message}
              </p>
            </div>

            {/* Quick Actions: Retry with Proxy / Direct */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {!useProxy ? (
                <button
                  type="button"
                  onClick={handleRetryWithProxy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Coba Lewat Proxy Lokal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRetryDirect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Coba Stream Langsung
                </button>
              )}

              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka Stream Tab Baru
              </a>
            </div>

            {/* Alternative Server Switcher directly inside Player */}
            {servers.length > 0 && onSelectServer && (
              <div className="pt-3 border-t border-white/15 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-primary" />
                  <span>Pilih server alternatif untuk melanjutkan:</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {servers.map((srv) => {
                    const isCurrent = srv.serverId === activeServerId;
                    return (
                      <button
                        key={srv.serverId}
                        type="button"
                        onClick={() => onSelectServer(srv.serverId)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                          isCurrent
                            ? "bg-primary/30 text-primary border border-primary/50"
                            : "bg-white/10 text-white hover:bg-primary hover:text-primary-foreground",
                        )}
                      >
                        {srv.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main VideoPlayer Component.
 * Supports:
 * 1. Direct HTML5 stream with Video.js (and backend Range proxy)
 * 2. MEGA.nz End-to-End client-decrypted embed with optimized sandbox and clear fallbacks
 * 3. Iframe Embed with Ad Shield
 * 4. Per-server error handling & instant server switching
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
}) {
  const [hasError, setHasError] = useState(false);
  const [adShieldActive, setAdShieldActive] = useState(true);
  const [proxyEnabled, setProxyEnabled] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

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

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
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
              Mempersiapkan jalur streaming dan kompatibilitas peramban...
            </p>
          </div>
        ) : isDirect ? (
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
          />
        ) : isMega ? (
          /* Specialized MEGA.nz Embed Player with Client-Side Decryption Support */
          <div className="relative h-full w-full bg-black">
            {/* Top helper notification bar for MEGA */}
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
              onError={() => setHasError(true)}
            />
          </div>
        ) : hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground bg-black/95">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <div className="space-y-1 max-w-md">
              <h4 className="font-display font-bold text-white text-sm">
                Server Menolak Koneksi Pemutaran
              </h4>
              <p className="text-xs text-muted-foreground">
                Server ini memiliki proteksi frame atau sedang mengalami gangguan dari penyedia.
              </p>
            </div>

            {/* Quick Server Switcher in Error State */}
            {servers.length > 0 && onSelectServer && (
              <div className="w-full max-w-sm space-y-2 pt-1 border-t border-white/10">
                <p className="text-[11px] font-semibold text-white/90">
                  Ganti ke Server Alternatif:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {servers.map((srv) => (
                    <button
                      key={srv.serverId}
                      type="button"
                      onClick={() => {
                        setHasError(false);
                        onSelectServer(srv.serverId);
                      }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                        srv.serverId === activeServerId
                          ? "bg-primary/25 text-primary border border-primary/40"
                          : "bg-white/10 text-white hover:bg-primary hover:text-primary-foreground",
                      )}
                    >
                      {srv.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAdShieldActive(false);
                  setHasError(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Muat Ulang
              </button>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4" />
                Buka Stream di Tab Baru
              </a>
            </div>
          </div>
        ) : (
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
            onError={() => setHasError(true)}
          />
        )}
      </div>

      {src ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isDirect
                ? proxyEnabled
                  ? "Stream Proxy Lokal (Anti-Blokir Range)"
                  : "Stream Langsung (Native HD)"
                : isMega
                  ? "MEGA Encrypted Stream"
                  : "Streaming Embed Siap"}
            </span>

            {/* Direct Proxy Toggle (gives user full control) */}
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

            {/* Ad Shield Toggle Indicator for iframes */}
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
                {isTheater ? "Tampilan Normal" : "Mode Bioskop"}
              </button>
            ) : null}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka di Tab Baru
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
