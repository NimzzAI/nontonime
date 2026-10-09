import { useRef } from "react";
import { ImagePlus, Loader2, Lock, Trash2 } from "lucide-react";
import { BORDER_STYLES, canUseBorder } from "@/lib/profile-style";
import type { UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { AvatarFrame } from "./AvatarFrame";

interface ProfileCustomizerProps {
  bannerUrl: string;
  uploadingBanner: boolean;
  onBannerFile: (file: File) => void;
  onBannerClear: () => void;
  borderId: string;
  onBorderChange: (id: string) => void;
  level: number;
  role: UserRole;
  avatarUrl: string;
  name: string;
}

/** Bagian pengaturan: banner profil (tampil di profil dan komentar) dan efek border. */
export function ProfileCustomizer({
  bannerUrl,
  uploadingBanner,
  onBannerFile,
  onBannerClear,
  borderId,
  onBorderChange,
  level,
  role,
  avatarUrl,
  name,
}: ProfileCustomizerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5 rounded-2xl border border-border/60 bg-secondary/20 p-4">
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-foreground">Banner Profil</p>
            <p className="text-[11px] text-muted-foreground">
              Tampil di profilmu dan di atas komentarmu. Disimpan di Supabase Storage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploadingBanner}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-60 cursor-pointer"
            >
              {uploadingBanner ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {uploadingBanner ? "Mengunggah..." : "Pilih Banner"}
            </button>
            {bannerUrl && (
              <button
                type="button"
                onClick={onBannerClear}
                aria-label="Hapus banner"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div
          className="h-20 w-full rounded-xl border border-border/70 bg-gradient-to-r from-primary/25 via-accent/15 to-primary/10 bg-cover bg-center sm:h-24"
          style={bannerUrl ? { backgroundImage: `url("${bannerUrl}")` } : undefined}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onBannerFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-2.5">
        <div>
          <p className="text-xs font-bold text-foreground">Efek Border</p>
          <p className="text-[11px] text-muted-foreground">
            Dipakai pada avatar dan kartu komentarmu. Naik level untuk membuka border baru.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BORDER_STYLES.map((b) => {
            const unlocked = canUseBorder(b, level, role);
            const selected = borderId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onBorderChange(b.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 bg-card p-2.5 text-center transition-all",
                  selected ? "border-primary ring-2 ring-primary/25" : "border-border/70",
                  unlocked
                    ? "cursor-pointer hover:border-primary/50"
                    : "cursor-not-allowed opacity-55",
                )}
              >
                <AvatarFrame src={avatarUrl} name={name} borderId={b.id} size={44} />
                <span className="text-[11px] font-bold text-foreground">{b.label}</span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  {!unlocked && <Lock className="h-2.5 w-2.5" />}
                  {b.ownerOnly ? "Khusus owner" : b.minLevel > 1 ? `Level ${b.minLevel}` : "Gratis"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
