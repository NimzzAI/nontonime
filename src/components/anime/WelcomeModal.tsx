import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  FastForward,
  UserCheck,
  Trophy,
  Bell,
  Play,
  Check,
} from "lucide-react";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if dismissed
    const dismissed = localStorage.getItem("nonton-welcome-dismissed");
    if (!dismissed) {
      // Small delay for smooth entry after hydration
      const timer = setTimeout(() => {
        setOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to manual open request
  useEffect(() => {
    const handleManualOpen = () => setOpen(true);
    window.addEventListener("open-welcome-modal", handleManualOpen);
    return () => window.removeEventListener("open-welcome-modal", handleManualOpen);
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("nonton-welcome-dismissed", "true");
    }
    setOpen(false);
  };

  const FEATURES = [
    {
      icon: Zap,
      title: "Multi-Server Cepat",
      desc: "Streaming resolusi 360p - 720p HD tanpa buffering.",
    },
    {
      icon: ShieldCheck,
      title: "Anti-Iklan Pop-up",
      desc: "Player sandbox melindungi dari pop-up dan redirect paksa.",
    },
    {
      icon: FastForward,
      title: "Auto-Next Episode",
      desc: "Otomatis memutar episode berikutnya saat selesai.",
    },
    {
      icon: Trophy,
      title: "Level, EXP & Rank",
      desc: "Dapatkan EXP setiap menonton & absen harian!",
    },
    {
      icon: UserCheck,
      title: "Login Google & Email",
      desc: "Sinkronkan riwayat & watchlist ke cloud Firebase.",
    },
    {
      icon: Bell,
      title: "Notifikasi Update HP",
      desc: "Kirim notifikasi jadwal rilis & info web langsung ke HP.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : setOpen(true))}>
      <DialogContent className="max-w-lg overflow-hidden border border-border/80 bg-background/98 p-0 sm:rounded-3xl shadow-2xl">
        {/* Banner Decoration */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-6 sm:p-7 border-b border-border/60">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-bold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Streaming Anime Subtitle Indonesia</span>
          </div>

          <DialogTitle className="font-display text-xl sm:text-2xl font-black text-foreground">
            Selamat Datang di <span className="text-primary">Nontonime</span>! 👋
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Platform streaming anime terlengkap, cepat, dan nyaman. Bebas ribet dengan fitur modern
            untuk memanjakan maraton anime kamu.
          </DialogDescription>
        </div>

        {/* Feature Grid */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Fitur Unggulan Nontonime:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-secondary/30 p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xs font-bold text-foreground">{feat.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Don't show again checkbox */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded-md border-border text-primary focus:ring-primary"
              />
              <span className="text-[11px]">Jangan tampilkan pop-up ini lagi</span>
            </label>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:bg-primary/90 active:scale-98 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Mulai Jelajahi & Nonton Anime 🍿</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
