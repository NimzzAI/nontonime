import React, { useState } from "react";
import { useClans, useUserClan, createClan, joinClan, leaveClan, type Clan } from "@/lib/clan";
import { useAuth, useFirestoreUserProfile } from "@/lib/firebase";
import {
  Users,
  Shield,
  Plus,
  Crown,
  Sparkles,
  Search,
  Check,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trophy,
  Zap,
  Flame,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClanManagerProps {
  className?: string;
  onOpenAuth?: (tab: "login" | "register") => void;
}

const BADGE_COLORS = [
  { label: "Api Konoha", value: "from-amber-500 to-orange-600" },
  { label: "Awan Merah", value: "from-rose-500 to-red-700" },
  { label: "Samudra Topi Jerami", value: "from-emerald-500 to-teal-600" },
  { label: "Sihir Jujutsu", value: "from-purple-500 to-indigo-700" },
  { label: "Sayap Kebebasan", value: "from-blue-500 to-cyan-600" },
  { label: "Kaisar Emas", value: "from-yellow-400 to-amber-500" },
];

export function ClanManager({ className, onOpenAuth }: ClanManagerProps) {
  const { user } = useAuth();
  const { profile, gamification } = useFirestoreUserProfile(user?.uid);
  const { clans, loading: clansLoading } = useClans();
  const { userClan, membership, loading: userClanLoading } = useUserClan(user?.uid);

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTag, setCreateTag] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createColor, setCreateColor] = useState(BADGE_COLORS[0].value);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredClans = clans.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.tag.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  const handleJoin = async (targetClan: Clan) => {
    if (!user) {
      onOpenAuth?.("login");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await joinClan(targetClan, {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || "Wibu Nontonime",
        username: profile?.username || "wibu",
        avatarUrl: profile?.avatarUrl || profile?.photoURL || user.photoURL || "",
        level: gamification.level,
        rankTitle: gamification.rankTitle,
        totalExp: gamification.totalExp,
      });

      setActionSuccess(`Berhasil bergabung dengan Clan ${targetClan.name}! (+50 XP 🎉)`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      console.error("Join clan error:", err);
      setActionError(err instanceof Error ? err.message : "Gagal bergabung ke Clan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !userClan) return;
    if (!window.confirm(`Apakah kamu yakin ingin keluar dari Clan ${userClan.name}?`)) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await leaveClan(userClan.id, user.uid);
      setActionSuccess(`Kamu telah keluar dari Clan ${userClan.name}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      console.error("Leave clan error:", err);
      setActionError(err instanceof Error ? err.message : "Gagal keluar dari Clan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth?.("login");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const created = await createClan(
        {
          name: createName,
          tag: createTag,
          description: createDesc,
          badgeColor: createColor,
        },
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName || "Ketua",
          username: profile?.username || "leader",
          avatarUrl: profile?.avatarUrl || profile?.photoURL || user.photoURL || "",
          level: gamification.level,
          rankTitle: gamification.rankTitle,
          totalExp: gamification.totalExp,
        },
      );

      setActionSuccess(`Clan "${created.name}" [${created.tag}] berhasil didirikan! (+150 XP 🚩)`);
      setShowCreateModal(false);
      setCreateName("");
      setCreateTag("");
      setCreateDesc("");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      console.error("Create clan error:", err);
      setActionError(err instanceof Error ? err.message : "Gagal mendirikan Clan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "space-y-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                Sistem Clan & Aliansi Wibu
              </h2>
              <span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                Firestore
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bergabung atau dirikan klan anime favoritmu untuk mengakumulasi XP bersama
              kawan-kawan!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!userClan && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onOpenAuth?.("login");
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Dirikan Clan (+150 XP)</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{actionError}</div>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{actionSuccess}</div>
        </div>
      )}

      {/* ACTIVE USER CLAN CARD */}
      {userClan && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr text-white text-xl font-black shadow-md",
                  userClan.badgeColor || "from-primary to-accent",
                )}
              >
                {userClan.tag}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-black text-foreground">
                    {userClan.name}
                  </h3>
                  <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-mono font-bold text-primary border border-primary/30">
                    [{userClan.tag}]
                  </span>
                  {membership?.role === "leader" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/30">
                      <Crown className="h-3 w-3" />
                      Ketua Clan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/80">
                      Anggota
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
                  {userClan.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="font-semibold text-card-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <strong>{userClan.memberCount || 1}</strong> Anggota
                  </span>
                  <span className="font-semibold text-amber-500 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <strong>{(userClan.totalXp || 0).toLocaleString()}</strong> Total XP Clan
                  </span>
                  <span className="text-muted-foreground">
                    Ketua: <strong>{userClan.leaderName}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLeave}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar Clan</span>
            </button>
          </div>
        </div>
      )}

      {/* BROWSE ALL CLANS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-extrabold text-foreground">
              Daftar Aliansi & Peringkat Clan
            </h3>
            <span className="text-xs text-muted-foreground">({clans.length} Clan Terdaftar)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari clan atau tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Clan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredClans.map((clan, idx) => {
            const isUserInThisClan = userClan?.id === clan.id;
            return (
              <div
                key={clan.id}
                className={cn(
                  "relative rounded-2xl border p-4.5 transition-all flex flex-col justify-between gap-3 shadow-xs",
                  isUserInThisClan
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-card hover:border-border hover:bg-secondary/20",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr text-white text-sm font-black shadow-sm",
                          clan.badgeColor || "from-primary to-accent",
                        )}
                      >
                        {clan.tag}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-black text-foreground">
                            {clan.name}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] font-mono font-bold text-muted-foreground border border-border/60">
                            [{clan.tag}]
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Ketua: <strong className="text-foreground">{clan.leaderName}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border/50">
                      Rank #{idx + 1}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {clan.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-card-foreground font-semibold flex items-center gap-1">
                      <Users className="h-3 w-3 text-primary" />
                      <strong>{clan.memberCount || 1}</strong>
                    </span>
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-current" />
                      <strong>{(clan.totalXp || 0).toLocaleString()}</strong> XP
                    </span>
                  </div>

                  {isUserInThisClan ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      Clan Aktif Kamu
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoin(clan)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/30 px-3 py-1 text-xs font-bold text-primary transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Gabung</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE CLAN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-black text-foreground">
                    Dirikan Clan Baru
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Dapatkan bonus kepemimpinan +150 EXP!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Nama Clan <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  placeholder="Contoh: Tokyo Manji Gang"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Tag Clan (Singkatan 2-5 Huruf) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="TOMAN"
                  value={createTag}
                  onChange={(e) =>
                    setCreateTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Motto / Slogan Clan</label>
                <textarea
                  rows={2}
                  maxLength={160}
                  placeholder="Deskripsikan tujuan dan semangat clan anime kamu..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Warna Tema Badge</label>
                <div className="grid grid-cols-3 gap-2">
                  {BADGE_COLORS.map((bc) => (
                    <button
                      key={bc.label}
                      type="button"
                      onClick={() => setCreateColor(bc.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-left cursor-pointer transition-all",
                        createColor === bc.value
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                          : "border-border hover:border-border/80",
                      )}
                    >
                      <span className={cn("h-4 w-4 rounded-full bg-gradient-to-tr", bc.value)} />
                      <span className="text-[10px] font-bold text-card-foreground truncate">
                        {bc.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Dirikan Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
