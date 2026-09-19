import { useEffect, useState } from "react";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";
import { cn } from "@/lib/utils";

export function WatchlistButton({
  animeId,
  title,
  poster,
  variant = "solid",
}: {
  animeId: string;
  title: string;
  poster: string | null;
  variant?: "solid" | "glass";
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(animeId));
  }, [animeId]);

  return (
    <button
      onClick={() => setSaved(toggleWatchlist(animeId, title, poster ?? ""))}
      aria-label={saved ? "Hapus dari watchlist" : "Simpan ke watchlist"}
      className={cn(
        "press-soft inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors",
        variant === "glass" ? "glass border-white/20 text-white" : "border-border bg-card text-card-foreground",
        saved && variant === "solid" ? "bg-secondary text-secondary-foreground" : null,
        !saved && variant === "solid" ? "hover:bg-accent" : null,
      )}
    >
      <i className={saved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"} />
    </button>
  );
}
