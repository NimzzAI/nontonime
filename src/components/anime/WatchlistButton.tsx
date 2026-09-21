import { useEffect, useState } from "react";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";

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
      type="button"
      onClick={() => setSaved(toggleWatchlist(animeId, title, poster ?? ""))}
      aria-label={saved ? "Hapus dari watchlist" : "Simpan ke watchlist"}
      title={saved ? "Tersimpan di Watchlist" : "Simpan ke Watchlist"}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95",
        variant === "glass"
          ? "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
          : "border-border/80 bg-secondary/50 text-foreground hover:bg-secondary",
        saved && "border-primary/50 text-primary bg-primary/10",
      )}
    >
      <Bookmark className={cn("h-4 w-4 transition-transform", saved && "fill-current scale-110")} />
    </button>
  );
}
