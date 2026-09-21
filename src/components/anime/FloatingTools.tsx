import { useState, useEffect } from "react";
import { Dices, ArrowUp, SlidersHorizontal, Sparkles } from "lucide-react";
import { AnimeGachaModal } from "./AnimeGachaModal";
import { cn } from "@/lib/utils";

export function FloatingTools({ onOpenFilter }: { onOpenFilter?: () => void }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [gachaOpen, setGachaOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowScrollTop(scrollY > 350);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div
        id="floating-quick-tools"
        className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-2 sm:bottom-6 sm:right-6"
      >
        {/* Surprise Gacha Button */}
        <button
          type="button"
          onClick={() => setGachaOpen(true)}
          title="Gacha Anime / Mau Nonton Apa?"
          aria-label="Putar anime acak"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-rose-500 text-primary-foreground shadow-lg shadow-primary/35 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Dices className="h-5 w-5 transition-transform group-hover:rotate-45" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-black">
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        </button>

        {/* Quick Filter button if provided */}
        {onOpenFilter ? (
          <button
            type="button"
            onClick={onOpenFilter}
            title="Buka Filter Kategori & Genre"
            aria-label="Filter anime"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-md backdrop-blur-md transition-all hover:border-primary/50 hover:text-primary active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        ) : null}

        {/* Scroll To Top with Progress Ring */}
        {showScrollTop ? (
          <button
            type="button"
            onClick={scrollToTop}
            title="Kembali ke atas"
            aria-label="Kembali ke atas"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-md backdrop-blur-md transition-all hover:border-primary/50 hover:text-primary active:scale-95 cursor-pointer"
          >
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-border/40"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-primary transition-all duration-150"
                strokeWidth="2.5"
                strokeDasharray="94.2"
                strokeDashoffset={94.2 - (94.2 * scrollProgress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <ArrowUp className="h-4 w-4 relative z-10" />
          </button>
        ) : null}
      </div>

      {/* Gacha Modal */}
      <AnimeGachaModal open={gachaOpen} onOpenChange={setGachaOpen} />
    </>
  );
}
