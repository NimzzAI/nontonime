import type { CSSProperties } from "react";
import { getBorder } from "@/lib/profile-style";
import { cn } from "@/lib/utils";

interface AvatarFrameProps {
  src?: string | null;
  name: string;
  borderId?: string | null;
  /** Ukuran sisi dalam piksel. */
  size?: number;
  round?: "xl" | "full";
  className?: string;
}

export function AvatarFrame({
  src,
  name,
  borderId,
  size = 40,
  round = "xl",
  className,
}: AvatarFrameProps) {
  const border = getBorder(borderId);
  const radius = round === "full" ? size : Math.max(10, Math.round(size * 0.28));
  const width = border.id === "none" ? 1 : size >= 64 ? 3 : 2;
  const style = {
    width: size,
    height: size,
    "--nt-frame-w": `${width}px`,
    "--nt-frame-r": `${radius}px`,
  } as CSSProperties;

  return (
    <span
      className={cn("nt-frame inline-flex shrink-0", border.className, className)}
      style={style}
    >
      <span className="nt-frame-inner flex h-full w-full items-center justify-center bg-muted">
        {src ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className="font-bold text-foreground"
            style={{ fontSize: Math.max(11, Math.round(size * 0.38)) }}
          >
            {(name || "?").charAt(0).toUpperCase()}
          </span>
        )}
      </span>
    </span>
  );
}
