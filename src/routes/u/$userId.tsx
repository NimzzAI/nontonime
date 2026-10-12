import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Pencil, Sparkles, Users } from "lucide-react";
import { AvatarFrame } from "@/components/social/AvatarFrame";
import { ClanChip, LevelBadge, OwnerBadge } from "@/components/social/UserBadges";
import { RelationButtons } from "@/components/social/RelationButtons";
import { usePublicProfile, useSocialActor, useSocialCounts } from "@/lib/social";
import { effectiveBorderId } from "@/lib/profile-style";
import { displayLevel, displayRank } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [
      { title: "Profil Pengguna : Nontonime" },
      { name: "description", content: "Profil, level, dan klan pengguna Nontonime." },
    ],
  }),
  component: PublicProfilePage,
});

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-center">
      <p className="font-display text-xl font-black text-foreground">{value ?? "-"}</p>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { profile, loading } = usePublicProfile(userId);
  const actor = useSocialActor();
  const counts = useSocialCounts(userId);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-48 animate-pulse rounded-3xl bg-secondary/60" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-xl font-black text-foreground">
          Pengguna tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Profil ini belum dibuat atau sudah dihapus.
        </p>
        <Link
          to="/komunitas"
          search={{ tab: "cari" }}
          className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          Cari pengguna lain
        </Link>
      </div>
    );
  }

  const level = displayLevel(profile.role, profile.level);
  const border = effectiveBorderId(profile.borderStyle, level, profile.role);
  const isOwner = profile.role === "owner";
  const isSelf = actor?.uid === profile.uid;
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
        <div
          className={cn(
            "relative h-36 bg-cover bg-center sm:h-48",
            !profile.bannerUrl &&
              (isOwner
                ? "bg-gradient-to-br from-amber-500/50 via-rose-500/40 to-violet-600/50"
                : "bg-gradient-to-br from-primary/40 via-primary/15 to-secondary"),
          )}
          style={profile.bannerUrl ? { backgroundImage: `url("${profile.bannerUrl}")` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        </div>

        <div className="relative px-5 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3">
            <AvatarFrame
              src={profile.avatarUrl}
              name={profile.displayName}
              borderId={border}
              size={96}
            />
            {isSelf ? (
              <Link
                to="/profil"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary/70"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Profil
              </Link>
            ) : (
              <RelationButtons targetUid={profile.uid} />
            )}
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={cn(
                  "font-display text-2xl font-black text-foreground",
                  isOwner && "nt-owner-name",
                )}
              >
                {profile.displayName}
              </h1>
              {isOwner && <OwnerBadge />}
              <LevelBadge role={profile.role} level={profile.level} />
              <ClanChip tag={profile.clanTag} name={profile.clan} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">@{profile.username}</p>
            {profile.bio && (
              <p className="whitespace-pre-line pt-1 text-sm leading-relaxed text-foreground/90">
                {profile.bio}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {displayRank(profile.role, profile.rankTitle)}
              </span>
              {!isOwner && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {profile.totalExp.toLocaleString("id-ID")} EXP
                </span>
              )}
              {profile.clan && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Klan {profile.clan}
                </span>
              )}
              {joined && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  Bergabung {joined}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Pengikut" value={counts.followers} />
        <Stat label="Mengikuti" value={counts.following} />
        <Stat label="Teman" value={counts.friends} />
      </section>
    </div>
  );
}
