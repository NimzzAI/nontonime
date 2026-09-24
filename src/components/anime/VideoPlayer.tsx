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
} from "lucide-react";

function isDirectSource(url: string) {
  return /\.(m3u8|mp4)(\?|$)/i.test(url);
}

function NativePlayer({ src, onEnded }: { src: string; onEnded?: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

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
      sources: [{ src, type: src.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4" }],
    });

    player.on("ended", () => {
      onEnded?.();
    });

    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [src, onEnded]);

  return <div ref={containerRef} className="h-full w-full" data-vjs-player />;
}

export function VideoPlayer({
  src,
  onToggleTheater,
  isTheater = false,
  onEnded,
}: {
  src: string | null;
  onToggleTheater?: () => void;
  isTheater?: boolean;
  onEnded?: () => void;
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

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
        {!src ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Menyiapkan pemutar video...</span>
          </div>
        ) : isDirectSource(src) ? (
          <NativePlayer src={src} onEnded={onEnded} />
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
            key={`${src}-${adShieldActive}`}
            src={src}
            title="Pemutar video"
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
              Streaming Siap
            </span>

            {/* Ad Shield Toggle Indicator */}
            <button
              type="button"
              onClick={() => setAdShieldActive((prev) => !prev)}
              title={
                adShieldActive
                  ? "Ad Shield Aktif: Pop-up iklan dan pengalihan otomatis diblokir"
                  : "Ad Shield Nonaktif: Klik untuk mengaktifkan perlindungan iklan"
              }
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
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
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheater ? (
              <button
                type="button"
                onClick={onToggleTheater}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent"
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
