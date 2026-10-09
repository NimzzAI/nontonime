import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  AtSign,
  CornerDownRight,
  Loader2,
  Megaphone,
  MessageCircle,
  Send,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { isGuestUser, useAuth } from "@/lib/firebase";
import { isOwnerEmail } from "@/lib/roles";
import {
  markNotificationRead,
  postAnnouncement,
  useAnnouncements,
  useSocialNotifications,
  type SocialNotification,
  type SocialNotificationType,
} from "@/lib/social-notifications";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<SocialNotificationType, typeof AtSign> = {
  reply: CornerDownRight,
  follow: UserPlus,
  friend_request: UserPlus,
  friend_accept: UserCheck,
  chat: MessageCircle,
};

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "Baru saja";
  if (sec < 3600) return `${Math.floor(sec / 60)} menit lalu`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} jam lalu`;
  return `${Math.floor(sec / 86400)} hari lalu`;
}

/** Daftar notifikasi sosial: balasan komentar, follow, pertemanan, dan pesan baru. */
export function SocialNotificationsPanel({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user && !isGuestUser(user) ? user.uid : null;
  const { items, loading } = useSocialNotifications(uid);

  if (!uid) {
    return (
      <p className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
        Masuk dengan akun untuk menerima notifikasi balasan, pengikut baru, permintaan teman, dan pesan.
      </p>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
        Belum ada notifikasi. Balasan komentar, pengikut baru, dan pesan akan muncul di sini.
      </p>
    );
  }

  const open = (n: SocialNotification) => {
    void markNotificationRead(uid, n.id);
    onNavigate();
    if (n.link) router.history.push(n.link);
  };

  return (
    <div className="space-y-2">
      {items.map((n) => {
        const Icon = TYPE_ICON[n.type] ?? AtSign;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => open(n)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors cursor-pointer",
              n.read ? "border-border/60 bg-card/60 hover:bg-card" : "border-primary/50 bg-primary/5",
            )}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border/80">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold leading-snug text-foreground">{n.text}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
            </span>
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

/** Pengumuman update situs (realtime). Owner melihat formulir untuk menulis pengumuman baru. */
export function AnnouncementsPanel() {
  const { user } = useAuth();
  const { items, readIds } = useAnnouncements();
  const isOwner = Boolean(
    user &&
      !isGuestUser(user) &&
      isOwnerEmail(
        (user as { email?: string | null }).email,
        (user as { emailVerified?: boolean }).emailVerified,
      ),
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await postAnnouncement(user.uid, { title, body });
      setTitle("");
      setBody("");
      setMsg("Pengumuman terkirim ke semua pengguna yang sedang membuka Nontonime.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal mengirim pengumuman.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {isOwner && (
        <form onSubmit={publish} className="space-y-2 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-500">
            <Megaphone className="h-3.5 w-3.5" />
            Kirim pengumuman (owner)
          </p>
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul, misalnya: Update v2.0 sudah rilis"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            value={body}
            maxLength={600}
            rows={3}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Isi pengumuman..."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">{msg}</span>
            <button
              type="submit"
              disabled={busy || !title.trim() || !body.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Kirim
            </button>
          </div>
        </form>
      )}

      {items.map((a) => {
        const unread = !readIds.includes(a.id);
        return (
          <div
            key={a.id}
            className={cn(
              "rounded-2xl border p-3.5",
              unread ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/60",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary">
                <Megaphone className="h-3 w-3" />
                Pengumuman
              </span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
            </div>
            <h5 className="mt-1.5 font-display text-xs font-bold text-foreground">{a.title}</h5>
            <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-muted-foreground">
              {a.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
