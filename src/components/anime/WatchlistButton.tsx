import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";
import { cn } from "@/lib/utils";
import { Bookmark, Check } from "lucide-react";
import { toast } from "sonner";

export function WatchlistButton({
  animeId,
  title,
  poster,
  variant = "solid",
  size = "md",
  showToast = true,
  className,
}: {
  animeId: string;
  title: string;
  poster: string | null;
  variant?: "solid" | "glass" | "card-overlay";
  size?: "sm" | "md" | "lg";
  showToast?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [showSpark, setShowSpark] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(animeId));

    const handleSync = () => {
      setSaved(isInWatchlist(animeId));
    };

    window.addEventListener("watchlist-updated", handleSync);
    return () => window.removeEventListener("watchlist-updated", handleSync);
  }, [animeId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nowSaved = toggleWatchlist(animeId, title, poster ?? "");
    setSaved(nowSaved);

    if (nowSaved) {
      setShowSpark(true);
      setTimeout(() => setShowSpark(false), 900);
      if (showToast) {
        toast.success(`"${title}" disimpan ke Watchlist`, {
          description: "Dapat diakses di profil dan menu Watchlist.",
          icon: <Bookmark className="h-4 w-4 fill-primary text-primary" />,
        });
      }
    } else {
      if (showToast) {
        toast.info(`"${title}" dihapus dari Watchlist`);
      }
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 sm:h-11 sm:w-11 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      aria-label={saved ? "Hapus dari watchlist" : "Simpan ke watchlist"}
      title={saved ? "Tersimpan di Watchlist" : "Simpan ke Watchlist"}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center border transition-colors select-none cursor-pointer",
        sizeClasses,
        variant === "glass" &&
          "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60",
        variant === "solid" &&
          "border-border/80 bg-secondary/60 text-foreground hover:bg-secondary hover:text-primary",
        variant === "card-overlay" &&
          "border-white/25 bg-black/65 text-white/90 backdrop-blur-md hover:bg-black/85 hover:text-white shadow-md",
        saved &&
          (variant === "card-overlay"
            ? "border-primary/80 bg-primary text-primary-foreground shadow-md shadow-primary/30"
            : "border-primary/50 text-primary bg-primary/10 shadow-xs"),
        className,
      )}
    >
      <motion.div
        key={saved ? "saved" : "unsaved"}
        initial={{ scale: 0.6, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className="flex items-center justify-center"
      >
        <Bookmark
          className={cn(iconSizes, "transition-transform", saved && "fill-current scale-110")}
        />
      </motion.div>

      {/* Spring-based celebratory spark rings when added */}
      <AnimatePresence>
        {showSpark ? (
          <>
            <motion.span
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 1.7, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary"
            />
            <motion.span
              initial={{ scale: 0, opacity: 1, y: 0 }}
              animate={{ scale: 1, opacity: 0, y: -16 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="pointer-events-none absolute -top-1 flex items-center justify-center text-primary"
            >
              <Check className="h-3.5 w-3.5" />
            </motion.span>
          </>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
