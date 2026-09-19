import { useEffect, useRef } from "react";
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

export function VideoPlayer({ src }: { src: string | null }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
      {!src ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl text-primary" />
          Menyiapkan pemutar video
        </div>
      ) : isDirectSource(src) ? (
        <NativePlayer src={src} />
      ) : (
        <iframe
          key={src}
          src={src}
          title="Pemutar video"
          className="h-full w-full border-0"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        />
      )}
    </div>
  );
}
