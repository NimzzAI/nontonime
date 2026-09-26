import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { homeQuery, popularQuery } from "@/lib/queries";
import { WatchlistButton } from "./WatchlistButton";
import { Dices, RefreshCw, Play, Star, CheckCircle2, Flame, Layers, Loader2 } from "lucide-react";
import type { AnimeSummary } from "@/lib/anime-types";
import { addExp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "all", label: "🎲 Semua Acak", desc: "Campuran segala genre" },
  { id: "hot", label: "🔥 Sedang Tren", desc: "Anime ongoing paling ramai" },
  { id: "completed", label: "✅ Sudah Tamat", desc: "Bisa langsung maraton sampai tamat" },
  { id: "recommend", label: "⭐ Rekomendasi", desc: "Pilihan terbaik kurator" },
] as const;

// Fallback anime items ensuring the roulette NEVER hangs even if network is offline or Sanka is loading
const FALLBACK_POOL: AnimeSummary[] = [
  {
    id: "frieren-beyond-journeys-end-sub-indo",
    title: "Sousou no Frieren",
    poster: "https://otakudesu.cloud/wp-content/uploads/2023/09/Sousou-no-Frieren-Sub-Indo.jpg",
    score: "9.35",
    type: "TV Series",
    status: "Completed",
    episodeCount: 28,
  },
  {
    id: "jujutsu-kaisen-s2-sub-indo",
    title: "Jujutsu Kaisen Season 2",
    poster:
      "https://otakudesu.cloud/wp-content/uploads/2023/07/Jujutsu-Kaisen-Season-2-Sub-Indo.jpg",
    score: "8.90",
    type: "TV Series",
    status: "Completed",
    episodeCount: 23,
  },
  {
    id: "one-piece-sub-indo",
    title: "One Piece",
    poster: "https://otakudesu.cloud/wp-content/uploads/2020/09/One-Piece-Sub-Indo.jpg",
    score: "8.72",
    type: "TV Series",
    status: "Ongoing",
    releaseDay: "Minggu",
  },
  {
    id: "kimetsu-no-yaiba-hashira-geiko-hen-sub-indo",
    title: "Kimetsu no Yaiba: Hashira Geiko-hen",
    poster:
      "https://otakudesu.cloud/wp-content/uploads/2024/05/Kimetsu-no-Yaiba-Hashira-Geiko-hen-Sub-Indo.jpg",
    score: "8.65",
    type: "TV Series",
    status: "Completed",
    episodeCount: 8,
  },
  {
    id: "solo-leveling-sub-indo",
    title: "Ore dake Level Up na Ken (Solo Leveling)",
    poster:
      "https://otakudesu.cloud/wp-content/uploads/2024/01/Ore-dake-Level-Up-na-Ken-Sub-Indo.jpg",
    score: "8.51",
    type: "TV Series",
    status: "Completed",
    episodeCount: 12,
  },
];

export function AnimeGachaModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: homeData, isLoading: homeLoading } = useQuery(homeQuery());
  const { data: popData } = useQuery(popularQuery(1));
  const [selectedMood, setSelectedMood] = useState<(typeof MOODS)[number]["id"]>("all");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<AnimeSummary | null>(null);

  // Pool of anime based on mood with fallbacks
  const pool = useMemo((): AnimeSummary[] => {
    let list: AnimeSummary[] = [];

    if (homeData) {
      if (selectedMood === "hot") list = homeData.hot;
      else if (selectedMood === "completed") list = homeData.popular;
      else if (selectedMood === "recommend") list = homeData.new;
      else list = [...homeData.slider, ...homeData.hot, ...homeData.popular, ...homeData.new];
    }

    if (list.length === 0 && popData?.items && popData.items.length > 0) {
      list = popData.items;
    }

    if (list.length === 0) {
      list = FALLBACK_POOL;
    }

    return list;
  }, [homeData, popData, selectedMood]);

  const spin = useCallback(() => {
    if (pool.length === 0) return;

    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setResult(pool[randomIdx] ?? pool[0]);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        setIsSpinning(false);
        addExp(10, "Putar Gacha Rekomendasi");
      }
    }, 85);
  }, [pool]);

  useEffect(() => {
    if (open && !result && !isSpinning) {
      spin();
    }
  }, [open, result, isSpinning, spin]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border border-border/80 bg-background/98 p-0 sm:rounded-3xl shadow-2xl">
        {/* Header decoration banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 sm:p-6 border-b border-border/60">
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
                  Bingung mau nonton apa? Putar roda rekomendasi anime pilihan!
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
                    setTimeout(spin, 40);
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
                isSpinning ? "scale-98 opacity-75" : "scale-100 shadow-md",
              )}
            >
              <div className="flex gap-4">
                {/* Poster */}
                <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted sm:w-28">
                  {result.poster ? (
                    <img
                      src={result.poster}
                      alt={result.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {result.score ? (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
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
                      ) : /tamat|completed/i.test(result.status ?? "") ? (
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
            <div className="flex h-36 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Memuat pilihan anime...</span>
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
