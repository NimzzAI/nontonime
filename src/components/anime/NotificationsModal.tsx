import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RECENT_SITE_UPDATES,
  getReadUpdateIds,
  markUpdateAsRead,
  markAllUpdatesAsRead,
  enablePhoneNotifications,
  sendTestUpdateNotification,
  type SiteUpdateItem,
} from "@/lib/notifications";
import { getPermission } from "@/lib/push";
import {
  Bell,
  Smartphone,
  CheckCheck,
  Sparkles,
  Server,
  Calendar,
  Layers,
  Send,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [readIds, setReadIds] = useState<string[]>(getReadUpdateIds());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    getPermission(),
  );
  const [busy, setBusy] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setReadIds(getReadUpdateIds());
      setPermission(getPermission());
    };
    window.addEventListener("site-updates-read-changed", update);
    return () => window.removeEventListener("site-updates-read-changed", update);
  }, []);

  const handleEnablePush = async () => {
    setBusy(true);
    setNotifMsg(null);
    try {
      const res = await enablePhoneNotifications();
      setPermission(res.permission);
      setNotifMsg(res.message);
    } finally {
      setBusy(false);
    }
  };

  const handleTestNotification = async () => {
    setBusy(true);
    try {
      await sendTestUpdateNotification();
      setNotifMsg("Notifikasi uji coba terkirim! Cek status bar HP/laptop kamu.");
    } catch {
      setNotifMsg("Gagal mengirim notifikasi uji coba.");
    } finally {
      setBusy(false);
    }
  };

  const handleReadAll = () => {
    markAllUpdatesAsRead();
    setReadIds(RECENT_SITE_UPDATES.map((u) => u.id));
  };

  const getTagIcon = (tag: SiteUpdateItem["tag"]) => {
    switch (tag) {
      case "fitur":
        return <Sparkles className="h-3.5 w-3.5 text-primary" />;
      case "server":
        return <Server className="h-3.5 w-3.5 text-emerald-500" />;
      case "jadwal":
        return <Calendar className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Layers className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border border-border/80 bg-background/98 p-0 sm:rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 sm:p-6 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg sm:text-xl font-black text-foreground">
                  Pusat Notifikasi & Update
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Pembaruan website, server, dan rilis anime terbaru
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReadAll}
              title="Tandai semua sudah dibaca"
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          </div>

          {/* Phone Notification Card Banner */}
          <div className="mt-4 rounded-2xl border border-border/80 bg-background/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Notifikasi ke HP & Browser
                </span>
              </div>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase",
                  permission === "granted"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {permission === "granted" ? "Aktif" : "Belum Aktif"}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Dapatkan peringatan instan saat episode baru tayang atau fitur baru diperbarui.
            </p>

            <div className="flex items-center gap-2 pt-1">
              {permission !== "granted" ? (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={busy || permission === "unsupported"}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                  <span>Aktifkan Notifikasi HP</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Kirim Tes Notifikasi HP</span>
                </button>
              )}
            </div>

            {notifMsg && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg">
                {notifMsg}
              </p>
            )}
          </div>
        </div>

        {/* Updates List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[50vh] overflow-y-auto">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Log Pembaruan Situs Nontonime
          </h4>

          <div className="space-y-2.5">
            {RECENT_SITE_UPDATES.map((item) => {
              const isUnread = !readIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => markUpdateAsRead(item.id)}
                  className={cn(
                    "rounded-2xl border p-3.5 transition-all cursor-pointer relative",
                    isUnread
                      ? "border-primary/50 bg-primary/5 shadow-xs"
                      : "border-border/60 bg-card/60 hover:bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background border border-border/80">
                        {getTagIcon(item.tag)}
                      </div>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-black text-foreground">
                        {item.version}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    </div>

                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                    )}
                  </div>

                  <h5 className="font-display text-xs font-bold text-foreground mt-2">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
