import { showLocalNotification, requestNotificationPermission, getPermission } from "./push";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface SiteUpdateItem {
  id: string;
  version: string;
  title: string;
  description: string;
  date: string;
  tag: "fitur" | "server" | "jadwal" | "sistem";
  unread?: boolean;
}

export const RECENT_SITE_UPDATES: SiteUpdateItem[] = [
  {
    id: "update-v15",
    version: "v1.5",
    title: "Sistem Level, EXP, Rank & Akun Email Resmi Hadir!",
    description:
      "Kini kamu bisa masuk lewat Email atau Google, mengumpulkan EXP dari nonton anime & absen harian, serta menaikkan rank wibu kamu.",
    date: "Hari ini",
    tag: "fitur",
  },
  {
    id: "update-v14",
    version: "v1.4",
    title: "Auto-Next Episode & Pelindung Anti-Iklan Pop-up",
    description:
      "Episode selanjutnya otomatis diputar setelah selesai. Player video kini terlindungi sandbox dari pop-up dan redirect paksa.",
    date: "Kemarin",
    tag: "fitur",
  },
  {
    id: "update-v13",
    version: "v1.3",
    title: "Server Streaming Cepat 720p HD & Multi-Cadangan",
    description:
      "Peningkatan kecepatan pemutaran video dengan caching cerdas dan opsi pilihan resolusi 360p, 480p, hingga 720p.",
    date: "3 hari lalu",
    tag: "server",
  },
  {
    id: "update-v12",
    version: "v1.2",
    title: "Jadwal Rilis Harian & Sinkronisasi Cloud Firebase",
    description:
      "Pantau anime favorit yang rilis tiap hari dari Senin sampai Minggu dengan sinkronisasi otomatis ke akun Google.",
    date: "Minggu lalu",
    tag: "jadwal",
  },
];

const READ_UPDATES_KEY = "nonton-read-updates-v1";

export function getReadUpdateIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_UPDATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markUpdateAsRead(id: string) {
  if (typeof window === "undefined") return;
  const list = getReadUpdateIds();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(READ_UPDATES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("site-updates-read-changed"));
  }
}

export function markAllUpdatesAsRead() {
  if (typeof window === "undefined") return;
  const allIds = RECENT_SITE_UPDATES.map((u) => u.id);
  localStorage.setItem(READ_UPDATES_KEY, JSON.stringify(allIds));
  window.dispatchEvent(new Event("site-updates-read-changed"));
}

export function getUnreadUpdatesCount(): number {
  const read = getReadUpdateIds();
  return RECENT_SITE_UPDATES.filter((u) => !read.includes(u.id)).length;
}

export async function enablePhoneNotifications(): Promise<{
  success: boolean;
  permission: NotificationPermission | "unsupported";
  message: string;
}> {
  const perm = await requestNotificationPermission();

  if (perm === "granted") {
    // Send welcome confirmation push notification to phone
    await showLocalNotification("Notifikasi Nontonime Aktif! 🔔", {
      body: "HP dan browser kamu akan menerima update episode terbaru serta pembaruan website.",
      tag: "welcome-notification",
    });

    // Save notification token / status to Firebase if user is logged in
    if (auth.currentUser) {
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid, "settings", "notifications"),
          {
            enabled: true,
            updatedAt: new Date().toISOString(),
            device: navigator.userAgent,
          },
          { merge: true },
        );
      } catch (err) {
        console.warn("Could not save push preference to Firestore:", err);
      }
    }

    return {
      success: true,
      permission: "granted",
      message: "Notifikasi berhasil diaktifkan untuk perangkat ini!",
    };
  }

  return {
    success: false,
    permission: perm,
    message:
      perm === "denied"
        ? "Notifikasi diblokir oleh browser/HP. Harap izinkan di setelan situs browser kamu."
        : "Izin notifikasi tidak diberikan.",
  };
}

export async function sendTestUpdateNotification(): Promise<boolean> {
  const latest = RECENT_SITE_UPDATES[0];
  return showLocalNotification(`Nontonime Update: ${latest.version} 🚀`, {
    body: `${latest.title} — ${latest.description}`,
    tag: "test-site-update",
  });
}
