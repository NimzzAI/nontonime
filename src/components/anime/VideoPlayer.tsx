import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

function isDirectSource(url: string) {
  return /\.(m3u8|mp4)(\?|$)/i.test(url);
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
    // If not a valid absolute URL, return as is
    return url;
  }
}

function NativePlayer({
  src,
  onEnded,
  autoPlay = false,
}: {
  src: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const endedFiredRef = useRef(false);
  const [isMutedAutoplay, setIsMutedAutoplay] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    endedFiredRef.current = false;
    setIsMutedAutoplay(false);
    setAutoplayBlocked(false);
  }, [src]);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = document.createElement("video-js");
    element.classList.add("vjs-big-play-centered", "h-full", "w-full");
    containerRef.current.appendChild(element);

    const player = videojs(element, {
      controls: true,
      fluid: false,
      preload: "auto",
      playsinline: true,
      autoplay: autoPlay ? true : false,
      sources: [{ src, type: src.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4" }],
    });

    const fireEnded = () => {
      if (endedFiredRef.current) return;
      endedFiredRef.current = true;
      onEnded?.();
    };

    player.on("ended", fireEnded);

    // Backup listener via timeupdate in case ended event is missed by browser
    player.on("timeupdate", () => {
      const dur = player.duration();
      const cur = player.currentTime();
      if (dur > 15 && cur >= dur - 0.4) {
        fireEnded();
      }
    });

    // Programmatic autoplay handling with resilient fallbacks
    if (autoPlay) {
      player.ready(() => {
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Unmuted autoplay restricted by browser policy:", err);
            // Fallback: try muted autoplay (allowed on almost all modern browsers)
            player.muted(true);
            const mutedPromise = player.play();
            if (mutedPromise !== undefined) {
              mutedPromise
                .then(() => {
                  setIsMutedAutoplay(true);
                })
                .catch((err2) => {
                  console.warn("Muted autoplay also blocked:", err2);
                  setAutoplayBlocked(true);
                });
            }
          });
        }
      });
    }

    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [src, autoPlay, onEnded]);

  const handleUnmute = () => {
    if (playerRef.current) {
      playerRef.current.muted(false);
      playerRef.current.volume(1);
      setIsMutedAutoplay(false);
    }
  };

  const handleManualPlay = () => {
    if (playerRef.current) {
      setAutoplayBlocked(false);
      playerRef.current.play();
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" data-vjs-player />

      {/* Muted autoplay notification with 1-click un-mute */}
      {isMutedAutoplay && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <VolumeX className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="font-medium text-[11px] sm:text-xs">
            Diputar tanpa suara karena kebijakan browser
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

      {/* Autoplay blocked overlay fallback */}
      {autoplayBlocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-4 text-center animate-in fade-in duration-200">
          <div className="rounded-2xl border border-white/20 bg-black/90 p-5 max-w-sm space-y-3.5 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/40 animate-pulse">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">Episode Berikutnya Siap</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Browser memblokir pemutaran otomatis tanpa interaksi. Klik tombol di bawah untuk
                mulai memutar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualPlay}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Putar Episode Sekarang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VideoPlayer({
  src,
  onToggleTheater,
  isTheater = false,
  onEnded,
  autoPlay = false,
  episodeTitle,
  isLoading = false,
}: {
  src: string | null;
  onToggleTheater?: () => void;
  isTheater?: boolean;
  onEnded?: () => void;
  autoPlay?: boolean;
  episodeTitle?: string;
  isLoading?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  // Ad shield isolates the iframe using HTML5 sandbox (blocks pop-ups and redirects)
  const [adShieldActive, setAdShieldActive] = useState(true);

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

  const iframeSrc = src ? formatIframeAutoplayUrl(src, autoPlay) : "";

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
        {isLoading || !src ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground bg-black/90">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="font-medium text-xs sm:text-sm">
              {isLoading ? "Menyiapkan episode berikutnya..." : "Menyiapkan pemutar video..."}
            </span>
          </div>
        ) : isDirectSource(src) ? (
          <NativePlayer src={src} onEnded={onEnded} autoPlay={autoPlay} />
        ) : hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <p className="max-w-md text-sm">
              Server ini membutuhkan izin tambahan atau mengalami kendala pemutaran.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdShieldActive(false);
                  setHasError(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Muat Tanpa Sandbox
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
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isDirectSource(src) ? "Stream Langsung (Native HD)" : "Streaming Siap"}
            </span>

            {/* Ad Shield Toggle Indicator for iframes */}
            {!isDirectSource(src) && (
              <button
                type="button"
                onClick={() => setAdShieldActive((prev) => !prev)}
                title={
                  adShieldActive
                    ? "Ad Shield Aktif: Pop-up iklan dan pengalihan otomatis diblokir"
                    : "Ad Shield Nonaktif: Klik untuk mengaktifkan perlindungan iklan"
                }
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  adShieldActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
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
