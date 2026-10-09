import {
  collection,
  deleteDoc,
  doc,
  endAt,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  auth,
  db,
  isGuestUser,
  sanitizeForFirestore,
  useAuth,
  type FirestoreUserProfile,
} from "./firebase";
import { resolveRole, type UserRole } from "./roles";
import { pushSocialNotification } from "./social-notifications";

/* ============================ Profil publik ============================ */

/**
 * Salinan aman dari users/{uid} yang boleh dibaca semua orang (komentar, profil, pencarian).
 * Email dan data pribadi lain tetap hanya di users/{uid}.
 */
export interface PublicProfile {
  uid: string;
  displayName: string;
  username: string;
  usernameLower: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  borderStyle: string;
  role: UserRole;
  level: number;
  rankTitle: string;
  totalExp: number;
  clanId: string;
  clan: string;
  clanTag: string;
  createdAt: number;
  updatedAt: number;
}

export interface SocialActor {
  uid: string;
  displayName: string;
  avatarUrl: string;
}

const SOCIAL_EVENT = "nontonime-social-changed";

export function emitSocialChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SOCIAL_EVENT));
}

function useSocialTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(SOCIAL_EVENT, handler);
    return () => window.removeEventListener(SOCIAL_EVENT, handler);
  }, []);
  return tick;
}

const profileCache = new Map<string, PublicProfile | null>();
const inflight = new Map<string, Promise<void>>();
const profileListeners = new Set<() => void>();
const emitProfiles = () => profileListeners.forEach((l) => l());

function loadProfile(uid: string): void {
  if (!uid || profileCache.has(uid) || inflight.has(uid)) return;
  const task = getDoc(doc(db, "profiles", uid))
    .then((snap) => {
      profileCache.set(uid, snap.exists() ? (snap.data() as PublicProfile) : null);
    })
    .catch(() => {
      profileCache.set(uid, null);
    })
    .finally(() => {
      inflight.delete(uid);
      emitProfiles();
    });
  inflight.set(uid, task);
}

export function invalidatePublicProfile(uid: string): void {
  profileCache.delete(uid);
  emitProfiles();
}

/** Mengambil banyak profil publik sekaligus dengan cache bersama (dipakai daftar komentar). */
export function usePublicProfiles(uids: string[]): Record<string, PublicProfile | undefined> {
  const [version, setVersion] = useState(0);
  const key = uids.join("|");

  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    profileListeners.add(listener);
    return () => {
      profileListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    uids.forEach(loadProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return useMemo(() => {
    const out: Record<string, PublicProfile | undefined> = {};
    for (const uid of uids) {
      const hit = profileCache.get(uid);
      if (hit) out[uid] = hit;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
}

/** Satu profil publik, realtime. loading=true selama belum ada jawaban pertama. */
export function usePublicProfile(uid: string | undefined | null) {
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      return;
    }
    setProfile(undefined);
    const unsub = onSnapshot(
      doc(db, "profiles", uid),
      (snap) => {
        const value = snap.exists() ? (snap.data() as PublicProfile) : null;
        profileCache.set(uid, value);
        setProfile(value);
      },
      () => setProfile(null),
    );
    return () => unsub();
  }, [uid]);

  return { profile: profile ?? null, loading: profile === undefined };
}

/** Pelaku aksi sosial dari akun yang sedang login (nama dan avatar diambil dari profil publiknya). */
export function useSocialActor(): SocialActor | null {
  const { user } = useAuth();
  const uid = user && !isGuestUser(user) ? user.uid : null;
  const { profile } = usePublicProfile(uid);
  if (!user || !uid) return null;
  return {
    uid,
    displayName:
      profile?.displayName || user.displayName || user.email?.split("@")[0] || "Pengguna",
    avatarUrl: profile?.avatarUrl || user.photoURL || "",
  };
}

/**
 * Menyalin users/{uid} ke profiles/{uid}. Dipanggil setelah login, ganti profil,
 * ganti klan, dan saat level berubah. Role owner hanya diberikan bila email Google
 * terverifikasi cocok, dan firestore.rules menolak role owner dari akun lain.
 */
export async function syncPublicProfile(uid: string): Promise<void> {
  if (!uid || uid.startsWith("guest_")) return;
  try {
    const [userSnap, prevSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      getDoc(doc(db, "profiles", uid)),
    ]);
    if (!userSnap.exists()) return;
    const u = userSnap.data() as FirestoreUserProfile & { borderStyle?: string };
    const prev = prevSnap.exists() ? (prevSnap.data() as Partial<PublicProfile>) : null;
    const current = auth.currentUser && auth.currentUser.uid === uid ? auth.currentUser : null;
    const role: UserRole = current
      ? resolveRole(current.email, current.emailVerified)
      : prev?.role === "owner"
        ? "owner"
        : "member";
    const g = u.gamification;
    const username = (u.username || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const payload: PublicProfile = {
      uid,
      displayName: u.displayName || "Pengguna",
      username: u.username || username,
      usernameLower: username,
      avatarUrl: u.avatarUrl || u.photoURL || "",
      bannerUrl: u.bannerUrl || "",
      bio: (u.bio || "").slice(0, 300),
      borderStyle: u.borderStyle || "none",
      role,
      level: Math.max(1, g?.level || 1),
      rankTitle: g?.rankTitle || "Penonton Pemula",
      totalExp: g?.totalExp || 0,
      clanId: u.clanId || "",
      clan: u.clan || "",
      clanTag: u.clanTag || "",
      createdAt: prev?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, "profiles", uid), sanitizeForFirestore(payload), { merge: true });
    invalidatePublicProfile(uid);
  } catch (err) {
    console.warn("Gagal menyinkronkan profil publik:", err);
  }
}

/** Pembaruan ringan level dan EXP (dipanggil dari saveGamification). */
export async function syncPublicLevel(
  uid: string,
  data: { level: number; totalExp: number; rankTitle: string },
): Promise<void> {
  if (!uid || uid.startsWith("guest_")) return;
  try {
    await updateDoc(doc(db, "profiles", uid), {
      level: Math.max(1, data.level || 1),
      totalExp: data.totalExp || 0,
      rankTitle: data.rankTitle || "Penonton Pemula",
    });
  } catch {
    // dokumen profil publik belum ada, akan dibuat oleh syncPublicProfile
  }
}

/* ============================== Cari pengguna ============================== */

export async function searchProfiles(term: string): Promise<PublicProfile[]> {
  const q = term
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/g, "");
  if (q.length < 2) return [];
  const snap = await getDocs(
    query(
      collection(db, "profiles"),
      orderBy("usernameLower"),
      startAt(q),
      endAt(q + "\uf8ff"),
      limit(20),
    ),
  );
  return snap.docs.map((d) => d.data() as PublicProfile);
}

/* ================================ Follow ================================ */

export const followDocId = (followerId: string, followeeId: string) =>
  `${followerId}_${followeeId}`;
export const pairId = (a: string, b: string) => [a, b].sort().join("_");

function assertCanAct(actor: SocialActor, targetUid: string) {
  if (!actor.uid || actor.uid.startsWith("guest_")) throw new Error("Masuk dengan akun dulu.");
  if (actor.uid === targetUid) throw new Error("Tidak bisa melakukan ini ke diri sendiri.");
}

export async function followUser(actor: SocialActor, targetUid: string): Promise<void> {
  assertCanAct(actor, targetUid);
  await setDoc(doc(db, "follows", followDocId(actor.uid, targetUid)), {
    followerId: actor.uid,
    followeeId: targetUid,
    createdAt: Date.now(),
  });
  await pushSocialNotification(targetUid, {
    id: `follow_${actor.uid}`,
    type: "follow",
    fromId: actor.uid,
    fromName: actor.displayName,
    fromAvatar: actor.avatarUrl,
    text: `${actor.displayName} mulai mengikuti kamu`,
    link: `/u/${actor.uid}`,
  });
  emitSocialChanged();
}

export async function unfollowUser(actorUid: string, targetUid: string): Promise<void> {
  await deleteDoc(doc(db, "follows", followDocId(actorUid, targetUid)));
  emitSocialChanged();
}

/* ================================ Teman ================================ */

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  fromAvatar: string;
  createdAt: number;
}

export async function sendFriendRequest(actor: SocialActor, targetUid: string): Promise<void> {
  assertCanAct(actor, targetUid);
  await setDoc(doc(db, "friendRequests", `${actor.uid}_${targetUid}`), {
    fromId: actor.uid,
    toId: targetUid,
    fromName: actor.displayName,
    fromAvatar: actor.avatarUrl,
    createdAt: Date.now(),
  });
  await pushSocialNotification(targetUid, {
    id: `fr_${actor.uid}`,
    type: "friend_request",
    fromId: actor.uid,
    fromName: actor.displayName,
    fromAvatar: actor.avatarUrl,
    text: `${actor.displayName} mengajak berteman`,
    link: "/komunitas?tab=permintaan",
  });
  emitSocialChanged();
}

export async function acceptFriendRequest(actor: SocialActor, fromUid: string): Promise<void> {
  assertCanAct(actor, fromUid);
  const [a, b] = [actor.uid, fromUid].sort() as [string, string];
  const batch = writeBatch(db);
  batch.set(doc(db, "friendships", `${a}_${b}`), { users: [a, b], createdAt: Date.now() });
  batch.delete(doc(db, "friendRequests", `${fromUid}_${actor.uid}`));
  await batch.commit();
  await pushSocialNotification(fromUid, {
    id: `fa_${actor.uid}`,
    type: "friend_accept",
    fromId: actor.uid,
    fromName: actor.displayName,
    fromAvatar: actor.avatarUrl,
    text: `${actor.displayName} menerima permintaan pertemanan kamu`,
    link: `/u/${actor.uid}`,
  });
  emitSocialChanged();
}

/** Menolak permintaan masuk atau membatalkan permintaan keluar. */
export async function removeFriendRequest(fromUid: string, toUid: string): Promise<void> {
  await deleteDoc(doc(db, "friendRequests", `${fromUid}_${toUid}`));
  emitSocialChanged();
}

export async function removeFriend(uidA: string, uidB: string): Promise<void> {
  await deleteDoc(doc(db, "friendships", pairId(uidA, uidB)));
  emitSocialChanged();
}

export type FriendState = "none" | "outgoing" | "incoming" | "friends";

export interface Relationship {
  friend: FriendState;
  following: boolean;
  ready: boolean;
}

/** Status hubungan antara pengguna login dan target: teman, permintaan, dan follow. */
export function useRelationship(meUid: string | null, targetUid: string | null): Relationship {
  const [state, setState] = useState<Relationship>({
    friend: "none",
    following: false,
    ready: false,
  });

  useEffect(() => {
    if (!meUid || !targetUid || meUid === targetUid || meUid.startsWith("guest_")) {
      setState({ friend: "none", following: false, ready: true });
      return;
    }
    const flags = { friends: false, outgoing: false, incoming: false, following: false };
    const ready = { friends: false, outgoing: false, incoming: false, following: false };
    const publish = () => {
      const friend: FriendState = flags.friends
        ? "friends"
        : flags.incoming
          ? "incoming"
          : flags.outgoing
            ? "outgoing"
            : "none";
      setState({
        friend,
        following: flags.following,
        ready: Object.values(ready).every(Boolean),
      });
    };
    const watch = (key: keyof typeof flags, path: [string, string]) =>
      onSnapshot(
        doc(db, path[0], path[1]),
        (snap) => {
          flags[key] = snap.exists();
          ready[key] = true;
          publish();
        },
        () => {
          ready[key] = true;
          publish();
        },
      );

    const unsubs = [
      watch("friends", ["friendships", pairId(meUid, targetUid)]),
      watch("outgoing", ["friendRequests", `${meUid}_${targetUid}`]),
      watch("incoming", ["friendRequests", `${targetUid}_${meUid}`]),
      watch("following", ["follows", followDocId(meUid, targetUid)]),
    ];
    return () => unsubs.forEach((u) => u());
  }, [meUid, targetUid]);

  return state;
}

export function useIncomingFriendRequests(uid: string | null) {
  const [items, setItems] = useState<FriendRequest[]>([]);
  useEffect(() => {
    if (!uid || uid.startsWith("guest_")) {
      setItems([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "friendRequests"), where("toId", "==", uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as FriendRequest), id: d.id }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setItems(list);
      },
      () => setItems([]),
    );
    return () => unsub();
  }, [uid]);
  return items;
}

export function useFriendIds(uid: string | null): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (!uid || uid.startsWith("guest_")) {
      setIds([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "friendships"), where("users", "array-contains", uid)),
      (snap) => {
        const out: string[] = [];
        snap.forEach((d) => {
          const users = (d.data() as { users?: string[] }).users ?? [];
          const other = users.find((u) => u !== uid);
          if (other) out.push(other);
        });
        setIds(out);
      },
      () => setIds([]),
    );
    return () => unsub();
  }, [uid]);
  return ids;
}

/** Daftar uid pengikut atau yang diikuti. */
export function useFollowIds(uid: string | null, direction: "followers" | "following"): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (!uid) {
      setIds([]);
      return;
    }
    const field = direction === "followers" ? "followeeId" : "followerId";
    const other = direction === "followers" ? "followerId" : "followeeId";
    const unsub = onSnapshot(
      query(collection(db, "follows"), where(field, "==", uid)),
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as Record<string, unknown>);
        rows.sort((a, b) => Number(b["createdAt"] ?? 0) - Number(a["createdAt"] ?? 0));
        setIds(rows.map((r) => String(r[other] ?? "")).filter(Boolean));
      },
      () => setIds([]),
    );
    return () => unsub();
  }, [uid, direction]);
  return ids;
}

export interface SocialCounts {
  followers: number | null;
  following: number | null;
  friends: number | null;
}

export function useSocialCounts(uid: string | null): SocialCounts {
  const tick = useSocialTick();
  const [counts, setCounts] = useState<SocialCounts>({
    followers: null,
    following: null,
    friends: null,
  });

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const [a, b, c] = await Promise.all([
          getCountFromServer(query(collection(db, "follows"), where("followeeId", "==", uid))),
          getCountFromServer(query(collection(db, "follows"), where("followerId", "==", uid))),
          getCountFromServer(
            query(collection(db, "friendships"), where("users", "array-contains", uid)),
          ),
        ]);
        if (!cancelled) {
          setCounts({
            followers: a.data().count,
            following: b.data().count,
            friends: c.data().count,
          });
        }
      } catch (err) {
        console.warn("Gagal memuat jumlah sosial:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, tick]);

  return counts;
}
