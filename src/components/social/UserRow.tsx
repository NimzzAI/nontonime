import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { usePublicProfiles } from "@/lib/social";
import { effectiveBorderId } from "@/lib/profile-style";
import { displayLevel } from "@/lib/roles";
import { AvatarFrame } from "./AvatarFrame";
import { ClanChip, LevelBadge, OwnerBadge } from "./UserBadges";

export function UserRow({ uid, right }: { uid: string; right?: ReactNode }) {
  const profiles = usePublicProfiles([uid]);
  const p = profiles[uid];
  const level = displayLevel(p?.role, p?.level);
  const border = effectiveBorderId(p?.borderStyle, level, p?.role);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3">
      <Link to="/u/$userId" params={{ userId: uid }} className="flex min-w-0 items-center gap-3">
        <AvatarFrame src={p?.avatarUrl} name={p?.displayName ?? "?"} borderId={border} size={44} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold text-foreground">
              {p?.displayName ?? "Pengguna"}
            </span>
            {p?.role === "owner" && <OwnerBadge />}
            <LevelBadge role={p?.role} level={p?.level} />
            <ClanChip tag={p?.clanTag} />
          </div>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            @{p?.username ?? uid.slice(0, 8)}
          </p>
        </div>
      </Link>
      {right}
    </div>
  );
}
