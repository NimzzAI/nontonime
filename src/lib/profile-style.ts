import type { UserRole } from "./roles";

export interface BorderStyleDef {
  id: string;
  label: string;
  description: string;
  /** Level minimum untuk membuka border ini. */
  minLevel: number;
  ownerOnly?: boolean;
  /** Kelas CSS di styles.css (nt-border-*). */
  className: string;
}

export const BORDER_STYLES: readonly BorderStyleDef[] = [
  { id: "none", label: "Polos", description: "Tanpa efek", minLevel: 1, className: "nt-border-none" },
  { id: "neon", label: "Neon Biru", description: "Cahaya neon tenang", minLevel: 3, className: "nt-border-neon" },
  { id: "sakura", label: "Sakura", description: "Gradasi merah muda lembut", minLevel: 6, className: "nt-border-sakura" },
  { id: "sunset", label: "Senja", description: "Gradasi senja bergerak", minLevel: 10, className: "nt-border-sunset" },
  { id: "aurora", label: "Aurora", description: "Cahaya aurora berputar", minLevel: 15, className: "nt-border-aurora" },
  { id: "gold", label: "Emas", description: "Kilau emas berjalan", minLevel: 28, className: "nt-border-gold" },
  { id: "royal", label: "Royal Owner", description: "Khusus pemilik situs", minLevel: 1, ownerOnly: true, className: "nt-border-royal" },
];

export function getBorder(id: string | undefined | null): BorderStyleDef {
  return BORDER_STYLES.find((b) => b.id === id) ?? BORDER_STYLES[0]!;
}

export function canUseBorder(
  def: BorderStyleDef,
  level: number,
  role: UserRole | string | undefined,
): boolean {
  if (def.ownerOnly) return role === "owner";
  return role === "owner" || level >= def.minLevel;
}

/** Border yang benar-benar dipakai: owner otomatis memakai Royal bila belum memilih yang lain. */
export function effectiveBorderId(
  chosen: string | undefined | null,
  level: number,
  role: UserRole | string | undefined,
): string {
  const def = getBorder(chosen);
  if (role === "owner") return chosen && chosen !== "none" ? def.id : "royal";
  return canUseBorder(def, level, role) ? def.id : "none";
}
