/**
 * Peran pengguna. Owner ditentukan dari email Google yang SUDAH TERVERIFIKASI,
 * jadi orang lain tidak bisa mengaku owner hanya dengan mendaftar memakai email yang sama.
 * Aturan yang sama diterapkan di firestore.rules (fungsi isOwner).
 */
export const OWNER_EMAILS: readonly string[] = ["nimzz8444@gmail.com"];

/** Level yang ditampilkan untuk owner. Hanya tampilan, tidak disimpan sebagai EXP. */
export const OWNER_LEVEL = 999;
export const OWNER_RANK_TITLE = "Pemilik Nontonime";

export type UserRole = "owner" | "member";

export function isOwnerEmail(email?: string | null, emailVerified?: boolean): boolean {
  if (!email || emailVerified !== true) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

export function resolveRole(email?: string | null, emailVerified?: boolean): UserRole {
  return isOwnerEmail(email, emailVerified) ? "owner" : "member";
}

export function displayLevel(role: UserRole | string | undefined, level: number | undefined): number {
  return role === "owner" ? OWNER_LEVEL : Math.max(1, level || 1);
}

export function displayRank(role: UserRole | string | undefined, rankTitle: string | undefined): string {
  return role === "owner" ? OWNER_RANK_TITLE : rankTitle || "Penonton Pemula";
}
