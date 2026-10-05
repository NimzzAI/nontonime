import { useState, useEffect } from "react";
import { readGamification, claimDailyCheckIn, type UserGamification } from "@/lib/gamification";
import { Trophy, Sparkles, Check, Gift, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserGamificationCard({
  compact = false,
  onOpenAuth,
  gamification: propGamification,
  isFirestoreSynced = false,
}: {
  compact?: boolean;
  onOpenAuth?: () => void;
  gamification?: UserGamification;
  isFirestoreSynced?: boolean;
}) {
  const [localData, setLocalData] = useState<UserGamification>(readGamification());
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalData(readGamification());
    };
    window.addEventListener("gamification-updated", handleUpdate);
    return () => window.removeEventListener("gamification-updated", handleUpdate);
  }, []);

  const data = propGamification || localData;
  const progressPercent = Math.min(100, Math.round((data.exp / Math.max(1, data.maxExp)) * 100));

  const handleClaim = () => {
    const result = claimDailyCheckIn();
    setCheckInMsg(result.message);
    setTimeout(() => setCheckInMsg(null), 4000);
  };

  const isCheckedInToday = data.lastCheckIn === new Date().toISOString().slice(0, 10);

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3 py-1.5 text-xs">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground text-[11px] shadow-xs">
          Lv.{data.level}
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground text-[11px] truncate max-w-[100px]">
              {data.rankTitle}
            </span>
            <span className="text-[10px] text-primary font-semibold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 p-5 shadow-sm space-y-4">
      {/* Top Bar with Firestore Status */}
      <div className="flex items-center justify-between text-xs pb-1 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          {isFirestoreSynced ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Tersinkronisasi Cloud Firestore
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px]">
              Penyimpanan Profil & Gamifikasi
            </span>
          )}
        </div>

        {/* Total XP Display */}
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold text-xs">
          <Zap className="h-3 w-3 fill-current" />
          <span>Total: {(data.totalExp ?? data.exp ?? 0).toLocaleString()} XP</span>
        </div>
      </div>

      {/* Header Level, Rank & Daily Check-in */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 font-black text-primary-foreground text-xl shadow-lg shadow-primary/25">
            <Trophy className="absolute -top-1.5 -right-1.5 h-5 w-5 text-amber-300 drop-shadow-sm" />
            <span>Lv.{data.level}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rank Saat Ini
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-extrabold">
                <Sparkles className="h-2.5 w-2.5" />
                Tier {data.level >= 20 ? "Master" : data.level >= 10 ? "Elit" : "Standard"}
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-black text-foreground">
              {data.rankTitle}
            </h3>
          </div>
        </div>

        {/* Daily Streak Check-in Button */}
        <button
          type="button"
          onClick={handleClaim}
          disabled={isCheckedInToday}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer",
            isCheckedInToday
              ? "bg-secondary text-muted-foreground border border-border/60 cursor-default"
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20 hover:scale-102 active:scale-98",
          )}
        >
          {isCheckedInToday ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Sudah Absen ({data.dailyStreak} Hari 🔥)</span>
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 animate-bounce" />
              <span>Absen Harian (+50 EXP)</span>
            </>
          )}
        </button>
      </div>

      {checkInMsg && (
        <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 animate-in fade-in">
          {checkInMsg}
        </div>
      )}

      {/* EXP Progress Bar toward next level */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            Progress Menuju Level {data.level + 1}
          </span>
          <span className="font-bold text-foreground">
            {data.exp} / {data.maxExp} EXP ({progressPercent}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Rewards breakdown badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60">
        <div className="rounded-xl bg-secondary/40 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Nonton Episode</p>
          <p className="text-xs font-bold text-primary">+20-25 EXP</p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Tamat Anime</p>
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400">+50 EXP</p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Tambah Watchlist</p>
          <p className="text-xs font-bold text-primary">+15 EXP</p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Absen Tiap Hari</p>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">+50-100 EXP</p>
        </div>
      </div>
    </div>
  );
}

export function ExpNotificationToast() {
  const [toast, setToast] = useState<{
    expGained: number;
    reason: string;
    leveledUp: boolean;
    newLevel: number;
    rankTitle: string;
  } | null>(null);

  useEffect(() => {
    const handleExp = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToast(detail);
      setTimeout(() => setToast(null), 3500);
    };
    window.addEventListener("exp-gained", handleExp);
    return () => window.removeEventListener("exp-gained", handleExp);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 pointer-events-none animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md">
          {toast.leveledUp ? "🆙" : "⚡"}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-primary">+{toast.expGained} EXP!</span>
            <span className="text-[11px] text-muted-foreground">({toast.reason})</span>
          </div>
          {toast.leveledUp ? (
            <p className="text-xs font-black text-foreground">
              🎉 LEVEL UP! Sekarang Level {toast.newLevel} ({toast.rankTitle})
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Terus tonton anime untuk naikkan rank!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
