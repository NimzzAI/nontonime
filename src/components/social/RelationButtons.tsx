import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Loader2, MessageCircle, UserCheck, UserMinus, UserPlus, X } from "lucide-react";
import {
  acceptFriendRequest,
  followUser,
  removeFriend,
  removeFriendRequest,
  sendFriendRequest,
  unfollowUser,
  useRelationship,
  useSocialActor,
} from "@/lib/social";
import { cn } from "@/lib/utils";

interface RelationButtonsProps {
  targetUid: string;
  showMessage?: boolean;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-50";
const solid = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/25";
const soft = "border border-border bg-secondary text-foreground hover:bg-secondary/70";

export function RelationButtons({
  targetUid,
  showMessage = true,
  className,
}: RelationButtonsProps) {
  const actor = useSocialActor();
  const rel = useRelationship(actor?.uid ?? null, targetUid);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!actor) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Masuk dengan akun untuk mengikuti, berteman, dan mengirim pesan.
      </p>
    );
  }
  if (actor.uid === targetUid) return null;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksi gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const Spinner = <Loader2 className="h-3.5 w-3.5 animate-spin" />;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !rel.ready}
          onClick={() =>
            run(() =>
              rel.following ? unfollowUser(actor.uid, targetUid) : followUser(actor, targetUid),
            )
          }
          className={cn(base, rel.following ? soft : solid)}
        >
          {busy ? (
            Spinner
          ) : rel.following ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {rel.following ? "Mengikuti" : "Ikuti"}
        </button>

        {rel.friend === "none" && (
          <button
            type="button"
            disabled={busy || !rel.ready}
            onClick={() => run(() => sendFriendRequest(actor, targetUid))}
            className={cn(base, soft)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Tambah Teman
          </button>
        )}
        {rel.friend === "outgoing" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => removeFriendRequest(actor.uid, targetUid))}
            className={cn(base, soft)}
          >
            <X className="h-3.5 w-3.5" />
            Batalkan Permintaan
          </button>
        )}
        {rel.friend === "incoming" && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => acceptFriendRequest(actor, targetUid))}
              className={cn(base, solid)}
            >
              <Check className="h-3.5 w-3.5" />
              Terima Teman
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => removeFriendRequest(targetUid, actor.uid))}
              className={cn(base, soft)}
            >
              <X className="h-3.5 w-3.5" />
              Tolak
            </button>
          </>
        )}
        {rel.friend === "friends" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Hapus dari daftar teman?")) {
                void run(() => removeFriend(actor.uid, targetUid));
              }
            }}
            className={cn(base, soft)}
          >
            <UserMinus className="h-3.5 w-3.5" />
            Teman
          </button>
        )}

        {showMessage && (
          <Link to="/chat" search={{ with: targetUid }} className={cn(base, soft)}>
            <MessageCircle className="h-3.5 w-3.5" />
            Pesan
          </Link>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
