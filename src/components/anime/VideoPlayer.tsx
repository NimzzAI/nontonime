import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

function isDirectSource(url: string) {
  return /\.(m3u8|mp4)(\?|$)/i.test(url);
}

function NativePlayer({ src }: { src: string }) {
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
    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [src]);

  return <div ref={containerRef} className="h-full w-full" data-vjs-player />;
}

export function VideoPlayer({
  src,
  onToggleTheater,
  isTheater = false,
}: {
  src: string | null;
  onToggleTheater?: () => void;
  isTheater?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
        {!src ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl text-primary" />
            <span>Menyiapkan pemutar video...</span>
          </div>
        ) : isDirectSource(src) ? (
          <NativePlayer src={src} />
        ) : hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
            <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-500" />
            <p className="max-w-md text-sm">
              Pemutar video mengalami kendala saat dimuat di dalam bingkai ini.
            </p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              Buka Stream di Tab Baru
            </a>
          </div>
        ) : (
          <iframe
            key={src}
            src={src}
            title="Pemutar video"
            className="h-full w-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        )}
      </div>

      {src ? (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Player Aktif
          </span>
          <div className="flex items-center gap-2">
            {onToggleTheater ? (
              <button
                onClick={onToggleTheater}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent"
              >
                <i className={isTheater ? "fa-solid fa-compress" : "fa-solid fa-expand"} />
                {isTheater ? "Tampilan Normal" : "Mode Bioskop"}
              </button>
            ) : null}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent hover:text-primary"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
              Buka di Tab Baru
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
