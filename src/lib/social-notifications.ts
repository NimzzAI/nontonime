import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db, sanitizeForFirestore } from "./firebase";
import { showLocalNotification } from "./push";
import { getUnreadUpdatesCount } from "./notifications";

export type SocialNotificationType =
  | "reply"
  | "follow"
  | "friend_request"
  | "friend_accept"
  | "chat";

export interface SocialNotification {
  id: string;
  type: SocialNotificationType;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  text: string;
  /** Path internal, misalnya /u/abc atau /chat?with=abc */
  link: string;
  read: boolean;
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  link: string;
  authorId: string;
  createdAt: number;
}

const READ_ANNOUNCEMENTS_KEY = "nonton-read-announcements-v1";
const READ_EVENT = "nonton-announcements-read-changed";

function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Menulis notifikasi ke kotak masuk pengguna lain. Gagal diam-diam: notifikasi tidak
 * boleh menggagalkan aksi utama (komentar, follow, dan seterusnya).
 * `id` tetap dipakai untuk menggabungkan notifikasi berulang dari orang yang sama.
 */
export async function pushSocialNotification(
  toUid: string,
  data: Omit<SocialNotification, "id" | "read" | "createdAt"> & { id?: string },
): Promise<void> {
  if (!toUid || toUid.startsWith("guest_") || toUid === data.fromId) return;
  try {
    const { id, ...rest } = data;
    const notifId = id ?? `n_${randomId()}`;
    await setDoc(
      doc(db, "users", toUid, "notifications", notifId),
      sanitizeForFirestore({ ...rest, read: false, createdAt: Date.now() }),
    );
  } catch (err) {
    console.warn("Gagal mengirim notifikasi sosial:", err);
  }
}

export function useSocialNotifications(uid: string | undefined | null) {
  const [items, setItems] = useState<SocialNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid || uid.startsWith("guest_")) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ ...(d.data() as SocialNotification), id: d.id })));
        setLoading(false);
      },
      (err) => {
        console.warn("Listener notifikasi sosial gagal:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  return { items, unread, loading };
}

export async function markNotificationRead(uid: string, id: string): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid, "notifications", id), { read: true });
  } catch (err) {
    console.warn("Gagal menandai notifikasi dibaca:", err);
  }
}

export async function markAllNotificationsRead(
  uid: string,
  items: SocialNotification[],
): Promise<void> {
  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const n of unread) {
      batch.update(doc(db, "users", uid, "notifications", n.id), { read: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn("Gagal menandai semua notifikasi dibaca:", err);
  }
}

/* ------------------------------ Pengumuman situs ------------------------------ */

function readAnnouncementIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_ANNOUNCEMENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>(readAnnouncementIds());

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as Announcement), id: d.id }))),
      (err) => console.warn("Listener pengumuman gagal:", err),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const sync = () => setReadIds(readAnnouncementIds());
    window.addEventListener(READ_EVENT, sync);
    return () => window.removeEventListener(READ_EVENT, sync);
  }, []);

  const unread = useMemo(() => items.filter((a) => !readIds.includes(a.id)).length, [items, readIds]);

  const markAllRead = useCallback(() => {
    try {
      const all = Array.from(new Set([...readAnnouncementIds(), ...items.map((a) => a.id)]));
      localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(all.slice(-100)));
      window.dispatchEvent(new Event(READ_EVENT));
    } catch {
      // penyimpanan penuh atau diblokir, abaikan
    }
  }, [items]);

  return { items, readIds, unread, markAllRead };
}

export async function postAnnouncement(
  authorId: string,
  data: { title: string; body: string; link?: string },
): Promise<void> {
  const title = data.title.trim().slice(0, 120);
  const body = data.body.trim().slice(0, 600);
  if (!title || !body) throw new Error("Judul dan isi pengumuman wajib diisi.");
  await addDoc(
    collection(db, "announcements"),
    sanitizeForFirestore({
      title,
      body,
      link: (data.link ?? "").trim().slice(0, 200),
      authorId,
      createdAt: Date.now(),
    }),
  );
}

/* ------------------------- Badge lonceng + notifikasi OS ------------------------- */

/** Total belum dibaca: log update situs lama, pengumuman, dan notifikasi sosial. */
export function useNotificationBadge(uid: string | undefined | null): number {
  const { unread: socialUnread } = useSocialNotifications(uid);
  const { unread: announcementUnread } = useAnnouncements();
  const [legacyUnread, setLegacyUnread] = useState(0);

  useEffect(() => {
    const sync = () => setLegacyUnread(getUnreadUpdatesCount());
    sync();
    window.addEventListener("site-updates-read-changed", sync);
    return () => window.removeEventListener("site-updates-read-changed", sync);
  }, []);

  return socialUnread + announcementUnread + legacyUnread;
}

/**
 * Menampilkan notifikasi sistem (HP atau desktop) saat ada notifikasi sosial atau pengumuman baru
 * dan tab sedang tidak dilihat. Hanya berjalan selama situs atau PWA masih terbuka.
 */
export function useRealtimeNotifier(uid: string | undefined | null): void {
  const seenSocial = useRef<Set<string> | null>(null);
  const seenAnnouncements = useRef<Set<string> | null>(null);

  useEffect(() => {
    seenSocial.current = null;
    if (!uid || uid.startsWith("guest_")) return;
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (seenSocial.current === null) {
          seenSocial.current = new Set(snap.docs.map((d) => `${d.id}:${d.data()["createdAt"]}`));
          return;
        }
        for (const change of snap.docChanges()) {
          if (change.type === "removed") continue;
          const data = change.doc.data() as SocialNotification;
          const key = `${change.doc.id}:${data.createdAt}`;
          if (seenSocial.current.has(key)) continue;
          seenSocial.current.add(key);
          if (data.read || document.visibilityState === "visible") continue;
          void showLocalNotification(data.fromName || "Nontonime", {
            body: data.text,
            tag: key,
            data: { url: data.link || "/" },
          });
        }
      },
      () => undefined,
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (seenAnnouncements.current === null) {
          seenAnnouncements.current = new Set(snap.docs.map((d) => d.id));
          return;
        }
        for (const change of snap.docChanges()) {
          if (change.type !== "added") continue;
          if (seenAnnouncements.current.has(change.doc.id)) continue;
          seenAnnouncements.current.add(change.doc.id);
          if (document.visibilityState === "visible") continue;
          const data = change.doc.data() as Announcement;
          void showLocalNotification(`Nontonime: ${data.title}`, {
            body: data.body,
            tag: `announcement-${change.doc.id}`,
            data: { url: data.link || "/" },
          });
        }
      },
      () => undefined,
    );
    return () => unsub();
  }, []);
}
