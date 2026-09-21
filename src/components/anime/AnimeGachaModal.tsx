import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { homeQuery } from "@/lib/queries";
import { WatchlistButton } from "./WatchlistButton";
import { Dices, Sparkles, RefreshCw, Play, Star, CheckCircle2, Flame, Layers } from "lucide-react";
import type { AnimeSummary } from "@/lib/anime-types";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "all", label: "🎲 Semua Acak", desc: "Campuran segala genre" },
  { id: "hot", label: "🔥 Sedang Tren", desc: "Anime ongoing paling ramai" },
  { id: "completed", label: "✅ Sudah Tamat", desc: "Bisa langsung maraton sampai tamat" },
  { id: "recommend", label: "⭐ Rekomendasi", desc: "Pilihan terbaik kurator" },
] as const;

export function AnimeGachaModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: homeData } = useQuery(homeQuery());
  const [selectedMood, setSelectedMood] = useState<(typeof MOODS)[number]["id"]>("all");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<AnimeSummary | null>(null);

  // Pool of anime based on mood
  const getPool = useCallback((): AnimeSummary[] => {
    if (!homeData) return [];
    if (selectedMood === "hot") return homeData.hot;
    if (selectedMood === "completed") return homeData.popular;
    if (selectedMood === "recommend") return homeData.new;
    return [...homeData.slider, ...homeData.hot, ...homeData.popular, ...homeData.new];
  }, [homeData, selectedMood]);

  const spin = useCallback(() => {
    const pool = getPool();
    if (pool.length === 0) return;

    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setResult(pool[randomIdx] ?? null);
      counter++;
      if (counter > 12) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 90);
  }, [getPool]);

  useEffect(() => {
    if (open && !result) {
      spin();
    }
  }, [open, result, spin]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border border-border/80 bg-background/95 p-0 backdrop-blur-2xl sm:rounded-3xl shadow-2xl">
        {/* Header decoration banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/25 via-primary/10 to-transparent p-5 sm:p-6 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <Dices className="h-5 w-5 animate-spin-slow" />
              </span>
              <div>
                <DialogTitle className="font-display text-lg sm:text-xl font-black text-foreground">
                  Gacha Anime Roulette
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Bingung mau nonton apa? Putar roda takdir anime pilihanmu!
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Mood pills selector */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {MOODS.map((mood) => {
              const active = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => {
                    setSelectedMood(mood.id);
                    setTimeout(spin, 50);
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs scale-102"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {mood.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roulette Display Area */}
        <div className="p-5 sm:p-6 space-y-5">
          {result ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 transition-all duration-300",
                isSpinning ? "scale-98 blur-[1px] opacity-75" : "scale-100 shadow-xl",
              )}
            >
              <div className="flex gap-4">
                {/* Poster with shine effect */}
                <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted sm:w-28">
                  {result.poster ? (
                    <img
                      src={result.poster}
                      alt={result.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {result.score ? (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-xs">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {result.score}
                    </span>
                  ) : null}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      {/ongoing/i.test(result.status ?? "") ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          <Flame className="h-2.5 w-2.5" />
                          ONGOING
                        </span>
                      ) : /tamat/i.test(result.status ?? "") ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          TAMAT
                        </span>
                      ) : null}

                      {result.episodeCount ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <Layers className="h-2.5 w-2.5 text-primary" />
                          {result.episodeCount} Eps
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-display text-sm sm:text-base font-bold leading-snug line-clamp-2 text-foreground">
                      {result.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {result.type || "TV Series"} · {result.releaseDay || "Sub Indo"}
                    </p>
                  </div>

                  <div className="pt-2">
                    <WatchlistButton
                      animeId={result.id}
                      title={result.title}
                      poster={result.poster}
                      variant="default"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
              Memuat pilihan anime...
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSpinning}
              onClick={spin}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-secondary/70 px-4 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-primary active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", isSpinning && "animate-spin text-primary")} />
              <span>{isSpinning ? "Mengacak..." : "Putar Lagi 🎲"}</span>
            </button>

            {result ? (
              <Link
                to="/anime/$animeId"
                params={{ animeId: result.id }}
                onClick={() => onOpenChange(false)}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:bg-primary/90 active:scale-95 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Nonton Sekarang</span>
              </Link>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
