import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/anime/ThemeToggle";
import { SectionTitle } from "@/components/anime/StateViews";
import { UserGamificationCard } from "@/components/anime/UserGamificationCard";
import { NotificationsModal } from "@/components/anime/NotificationsModal";
import { AuthModal } from "@/components/anime/AuthModal";
import { UserProfile } from "@/components/anime/UserProfile";
import { WatchingList } from "@/components/anime/WatchingList";
import { readSubscriptions, removeSubscription, type SubscriptionItem } from "@/lib/subscriptions";
import { getPermission, requestNotificationPermission, showLocalNotification } from "@/lib/push";
import { readHistory } from "@/lib/history";
import { readWatchlist, type WatchlistItem } from "@/lib/watchlist";
import {
  useAuth,
  signOutUser,
  useFirestoreUserProfile,
  useFirestoreWatchlist,
} from "@/lib/firebase";
import {
  Bookmark,
  ChevronRight,
  LogOut,
  ShieldCheck,
  UserCheck,
  Bell,
  LogIn,
  UserPlus,
  Trophy,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Cloud,
  RefreshCw,
  Trash2,
  History,
} from "lucide-react";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil Pengguna & Level : Nontonime" },
      {
        name: "description",
        content:
          "Pantau rank wibu, total XP, level akun, dan daftar anime yang sedang ditonton dari Firestore.",
      },
      { property: "og:title", content: "Profil Pengguna & Level : Nontonime" },
      {
        property: "og:description",
        content:
          "Pantau rank wibu, total XP, level akun, dan daftar anime yang sedang ditonton dari Firestore.",
      },
    ],
  }),
  component: ProfilPage,
});

function ProfileStatsGrid() {
  const { user } = useAuth();
  const { gamification } = useFirestoreUserProfile(user?.uid);
  const { items: watchlistItems } = useFirestoreWatchlist(user?.uid);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const sync = () => setHistoryCount(readHistory().length);
    sync();
    window.addEventListener("history-updated", sync);
    return () => window.removeEventListener("history-updated", sync);
  }, []);

  const watchingCount = watchlistItems.filter((i) => (i.status || "plan") === "watching").length;
  const completedCount = watchlistItems.filter((i) => (i.status || "plan") === "completed").length;
  const planningCount = watchlistItems.filter((i) => (i.status || "plan") === "plan").length;

  const stats = [
    {
      label: "Account Level",
      value: `Lv. ${gamification.level}`,
      sub: gamification.rankTitle,
      icon: Trophy,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total XP",
      value: (gamification.totalExp ?? gamification.exp ?? 0).toLocaleString(),
      sub: `${gamification.exp} / ${gamification.maxExp} ke Lv.${gamification.level + 1}`,
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Sedang Ditonton",
      value: watchingCount,
      sub: "Anime aktif",
      icon: Play,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Anime Tamat",
      value: completedCount,
      sub: "Completed",
      icon: CheckCircle2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg} ${item.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-display text-xl font-black text-foreground">{item.value}</span>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotificationCard({ onOpenNotifModal }: { onOpenNotifModal: () => void }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission(getPermission());
    const sync = () => setSubs(readSubscriptions());
    sync();
    window.addEventListener("subs-updated", sync);
    return () => window.removeEventListener("subs-updated", sync);
  }, []);

  async function handleEnable() {
    setBusy(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    await showLocalNotification("Notifikasi Nontonime 🔔", {
      body: "Notifikasi ke HP kamu sudah aktif! Kamu akan menerima info episode terbaru dan update situs.",
    });
  }

  return (
    <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-card-foreground">Pusat Notifikasi & Update HP</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {permission === "unsupported"
              ? "Browser ini tidak mendukung notifikasi web."
              : permission === "granted"
                ? "Notifikasi update aktif di perangkat ini."
                : permission === "denied"
                  ? "Notifikasi diblokir browser. Izinkan melalui pengaturan browser HP."
                  : "Aktifkan notifikasi untuk menerima rilis episode & update website."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permission === "granted" ? (
            <button
              type="button"
              onClick={handleTest}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
            >
              Kirim Tes HP
            </button>
          ) : permission === "default" ? (
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50"
            >
              Aktifkan di HP
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenNotifModal}
            className="rounded-xl border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
          >
            Log Pembaruan
          </button>
        </div>
      </div>

      {subs.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Anime yang di-subscribe ({subs.length})
          </p>
          <ul className="space-y-1.5">
            {subs.map((item) => (
              <li key={item.animeId} className="flex items-center justify-between gap-2">
                <Link
                  to="/anime/$animeId"
                  params={{ animeId: item.animeId }}
                  className="line-clamp-1 text-sm text-card-foreground hover:text-primary"
                >
                  {item.animeTitle}
                </Link>
                <button
                  type="button"
                  onClick={() => removeSubscription(item.animeId)}
                  aria-label="Berhenti subscribe"
                  className="shrink-0 text-xs text-muted-foreground hover:text-destructive cursor-pointer p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ProfilPage() {
  const { user } = useAuth();
  const { gamification } = useFirestoreUserProfile(user?.uid);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthTab(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <SectionTitle title="Profil, Level & Progres Nonton" icon={UserCheck} />
      </div>

      {/* Profile Header (Shows user account & Firestore rank/XP/level, avatar upload via Storage, username/name edit) */}
      <UserProfile onOpenAuth={handleOpenAuth} />

      {/* Gamification Level, EXP, and Rank Card */}
      <UserGamificationCard
        gamification={gamification}
        isFirestoreSynced={Boolean(user)}
        onOpenAuth={() => handleOpenAuth("register")}
      />

      {/* Key Statistics Grid */}
      <ProfileStatsGrid />

      {/* User's Watching & Planning List Component (with Episode Tracker & Firestore persistence) */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <WatchingList
          initialFilter="watching"
          showHeader={true}
          onOpenAuth={() => handleOpenAuth("login")}
        />
      </div>

      {/* Settings: Theme Toggle & Notification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div>
            <p className="text-sm font-bold text-card-foreground">Tema Tampilan</p>
            <p className="text-xs text-muted-foreground">
              Pilih mode terang atau gelap sesuai seleramu.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="divide-y divide-border/60 rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm flex flex-col justify-center">
          <Link
            to="/watchlist"
            className="flex items-center justify-between px-5 py-3 text-xs font-bold text-card-foreground hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Bookmark className="h-4 w-4 text-primary" />
              Watchlist Lengkap & Cadangkan Data
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/riwayat"
            className="flex items-center justify-between px-5 py-3 text-xs font-bold text-card-foreground hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-primary" />
              Riwayat Episode yang Ditonton
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <NotificationCard onOpenNotifModal={() => setNotifModalOpen(true)} />

      {/* Auth & Notification Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} initialTab={authTab} />
      <NotificationsModal open={notifModalOpen} onOpenChange={setNotifModalOpen} />
    </div>
  );
}
