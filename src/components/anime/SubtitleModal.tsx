import React, { useRef, useState } from "react";
import {
  Subtitles,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Trash2,
  Sliders,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubIndo: boolean;
  activeServerTitle?: string;
  customSubtitleName: string | null;
  onUploadSubtitle: (file: File) => void;
  onRemoveSubtitle: () => void;
  subtitleFontSize: "sm" | "base" | "lg";
  onChangeFontSize: (size: "sm" | "base" | "lg") => void;
  subtitleOffset: number;
  onChangeOffset: (offset: number) => void;
  onSwitchToSubIndoServer?: () => void;
  hasSubIndoServerAvailable?: boolean;
}

export function SubtitleModal({
  isOpen,
  onClose,
  isSubIndo,
  activeServerTitle,
  customSubtitleName,
  onUploadSubtitle,
  onRemoveSubtitle,
  subtitleFontSize,
  onChangeFontSize,
  subtitleOffset,
  onChangeOffset,
  onSwitchToSubIndoServer,
  hasSubIndoServerAvailable,
}: SubtitleModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".srt") && !lower.endsWith(".vtt")) {
      setErrorMsg("Format file harus berupa .srt atau .vtt");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file terlalu besar (maksimal 5MB)");
      return;
    }

    onUploadSubtitle(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-5 sm:p-6 text-foreground shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Subtitles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                Pengaturan Subtitle & Takarir
              </h3>
              <p className="text-xs text-muted-foreground">
                Informasi takarir bahasa Indonesia & impor subtitle kustom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/80 bg-muted/60 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Subtitle Saat Ini */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Status Server & Subtitle Saat Ini
          </h4>
          {isSubIndo ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Subtitle Indonesia Aktif (Hardsub HD)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Server <strong>{activeServerTitle || "aktif"}</strong> sudah memiliki teks takarir
                bahasa Indonesia yang tertanam langsung pada video (Hardsub). Teks akan otomatis
                muncul di layar saat video diputar tanpa perlu mengaktifkan pengaturan tambahan.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Server Non-Indo / Subtitle Inggris</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Server <strong>{activeServerTitle || "aktif"}</strong> menggunakan teks atau audio
                non-Indonesia.
              </p>
              {hasSubIndoServerAvailable && onSwitchToSubIndoServer ? (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToSubIndoServer();
                    onClose();
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer shadow-xs"
                >
                  <span>Beralih ke Server Sub Indo (Rekomendasi)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Upload Custom Subtitle (.srt / .vtt) */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Unggah Subtitle Kustom (.srt / .vtt)</span>
            </h4>
            {customSubtitleName ? (
              <span className="rounded-full bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary">
                Kustom Aktif
              </span>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Punya file takarir sendiri? Unggah file subtitle lokal dalam format{" "}
            <strong>.srt</strong> atau <strong>.vtt</strong> untuk ditampilkan di atas video.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt"
            onChange={handleFileChange}
            className="hidden"
          />

          {customSubtitleName ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/10 p-2.5">
              <div className="flex items-center gap-2 truncate text-xs font-semibold text-primary">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{customSubtitleName}</span>
              </div>
              <button
                type="button"
                onClick={onRemoveSubtitle}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/20 transition cursor-pointer shrink-0"
              >
                <Trash2 className="h-3 w-3" />
                <span>Hapus</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-muted/30 hover:bg-muted/60 p-3 text-xs font-bold text-foreground transition cursor-pointer"
            >
              <Upload className="h-4 w-4 text-primary" />
              <span>Pilih File Subtitle (.srt / .vtt) dari Perangkat</span>
            </button>
          )}

          {errorMsg ? (
            <p className="text-[11px] font-semibold text-destructive">{errorMsg}</p>
          ) : null}
        </div>

        {/* Pengaturan Tampilan Subtitle Kustom */}
        {customSubtitleName ? (
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Pengaturan Subtitle Kustom</span>
            </h4>

            {/* Font Size */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground font-medium">Ukuran Teks:</span>
              <div className="flex items-center gap-1">
                {(["sm", "base", "lg"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onChangeFontSize(size)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer",
                      subtitleFontSize === size
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {size === "sm" ? "Kecil" : size === "base" ? "Standar" : "Besar"}
                  </button>
                ))}
              </div>
            </div>

            {/* Offset Sinkronisasi */}
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs text-foreground font-medium">
                  Sinkronisasi Audio/Teks:
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Offset waktu: {subtitleOffset > 0 ? `+${subtitleOffset}s` : `${subtitleOffset}s`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangeOffset(Math.max(-5, subtitleOffset - 0.5))}
                  className="rounded-lg bg-muted px-2 py-1 text-xs font-bold hover:bg-accent transition cursor-pointer"
                >
                  -0.5s
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOffset(0)}
                  className="rounded-lg bg-muted px-2 py-1 text-xs font-bold hover:bg-accent transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOffset(Math.min(5, subtitleOffset + 0.5))}
                  className="rounded-lg bg-muted px-2 py-1 text-xs font-bold hover:bg-accent transition cursor-pointer"
                >
                  +0.5s
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Panduan Singkat */}
        <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 border border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>Bagaimana Cara Menonton dengan Sub Indo?</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            1. Di bawah video, pastikan tombol server yang terpilih memiliki label{" "}
            <strong>[SUB INDO]</strong> (seperti RAPSODI HD atau Samehadaku).
            <br />
            2. Server bertanda [SUB INDO] menyajikan teks bahasa Indonesia yang langsung tercetak di
            video (Hardsub).
            <br />
            3. Jika ingin mengganti kualitas (1080p FHD / 720p HD), klik tombol resolusi di daftar
            server.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
