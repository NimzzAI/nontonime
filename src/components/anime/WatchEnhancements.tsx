import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles, Keyboard, X, Check, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchEnhancementsProps {
  isAmbient: boolean;
  onToggleAmbient: () => void;
  onSleepExpired: () => void;
}

const TIMER_OPTIONS = [
  { label: "Mati", minutes: 0 },
  { label: "15 Menit", minutes: 15 },
  { label: "30 Menit", minutes: 30 },
  { label: "45 Menit", minutes: 45 },
  { label: "60 Menit", minutes: 60 },
];

export function WatchEnhancements({
  isAmbient,
  onToggleAmbient,
  onSleepExpired,
}: WatchEnhancementsProps) {
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showKeyboardModal, setShowKeyboardModal] = useState(false);

  // Handle countdown
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSleepTimerMinutes(0);
          onSleepExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, onSleepExpired]);

  const handleSetTimer = (minutes: number) => {
    setSleepTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setShowTimerModal(false);
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <>
      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Ambient Mode Toggle */}
        <button
          type="button"
          onClick={onToggleAmbient}
          className={cn(
            "press-soft inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all",
            isAmbient
              ? "border-amber-500/50 bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-xs"
              : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          title="Nyalakan/matikan efek lampu bioskop sekitar pemutar video"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Lampu Bioskop</span>
        </button>

        {/* Sleep Timer Button */}
        <button
          type="button"
          onClick={() => setShowTimerModal(true)}
          className={cn(
            "press-soft inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all",
            remainingSeconds > 0
              ? "border-primary bg-primary/15 text-primary shadow-xs"
              : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          title="Atur pengatur waktu tidur otomatis"
        >
          <Timer className="h-3.5 w-3.5" />
          {remainingSeconds > 0 ? (
            <span className="font-mono font-bold text-primary">
              {formatCountdown(remainingSeconds)}
            </span>
          ) : (
            <span className="hidden sm:inline">Timer Tidur</span>
          )}
        </button>

        {/* Keyboard Shortcuts Guide */}
        <button
          type="button"
          onClick={() => setShowKeyboardModal(true)}
          className="press-soft inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Panduan tombol pintasan keyboard"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pintasan</span>
        </button>
      </div>

      {/* Sleep Timer Dialog */}
      {showTimerModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowTimerModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Pengatur Waktu Tidur</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTimerModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Cocok bagi kamu yang suka nonton anime sebelum tidur. Video akan dihentikan secara
              otomatis saat timer habis agar kuota hemat.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {TIMER_OPTIONS.map((opt) => {
                const isSelected = sleepTimerMinutes === opt.minutes;
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => handleSetTimer(opt.minutes)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border/80 bg-secondary/40 hover:bg-secondary text-foreground",
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                );
              })}
            </div>

            {remainingSeconds > 0 ? (
              <div className="rounded-xl bg-primary/10 p-3 text-center text-xs text-primary font-semibold">
                Timer aktif: sisa waktu{" "}
                <span className="font-mono font-bold text-sm">
                  {formatCountdown(remainingSeconds)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Keyboard Shortcuts Dialog */}
      {showKeyboardModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowKeyboardModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Pintasan Keyboard</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyboardModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Putar / Jeda Video</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono font-semibold">
                  Spasi / K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Layar Penuh (Fullscreen)</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono font-semibold">
                  F
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Mode Bioskop (Theater)</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono font-semibold">
                  T
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Mundur / Maju 10 Detik</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono font-semibold">
                  J / L atau ← / →
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Bisukan Suara (Mute)</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono font-semibold">
                  M
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Cari Cepat Anime Global</span>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono font-semibold">
                  Ctrl + K / ⌘ + K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
