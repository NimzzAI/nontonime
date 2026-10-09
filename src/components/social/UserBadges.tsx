import { Crown, Users } from "lucide-react";
import { displayLevel, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function OwnerBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-sm",
        className,
      )}
      title="Pemilik Nontonime"
    >
      <Crown className="h-2.5 w-2.5" />
      Owner
    </span>
  );
}

export function LevelBadge({
  role,
  level,
  className,
}: {
  role?: UserRole | string | undefined;
  level?: number | undefined;
  className?: string;
}) {
  const isOwner = role === "owner";
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[9px] font-bold",
        isOwner
          ? "border-amber-400/50 bg-amber-400/15 text-amber-500"
          : "border-primary/20 bg-primary/10 text-primary",
        className,
      )}
    >
      Lv.{displayLevel(role, level)}
    </span>
  );
}

export function ClanChip({
  tag,
  name,
  className,
}: {
  tag?: string | undefined;
  name?: string | undefined;
  className?: string;
}) {
  if (!tag && !name) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border/70 bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground",
        className,
      )}
      title={name ? `Klan ${name}` : undefined}
    >
      <Users className="h-2.5 w-2.5 text-primary" />
      {tag ? `[${tag}]` : null} {name}
    </span>
  );
}
